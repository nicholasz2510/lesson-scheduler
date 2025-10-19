import json
import os
import sys
from datetime import datetime, timedelta
from types import ModuleType, SimpleNamespace

import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

if "extensions" not in sys.modules:
    extensions_module = ModuleType("extensions")
    extensions_module.db = SimpleNamespace()
    sys.modules["extensions"] = extensions_module

if "models" not in sys.modules:
    sys.modules["models"] = ModuleType("models")

models_models = ModuleType("models.models")

if "sqlalchemy" not in sys.modules:
    sqlalchemy_module = ModuleType("sqlalchemy")
    sqlalchemy_exc = ModuleType("sqlalchemy.exc")
    sqlalchemy_orm = ModuleType("sqlalchemy.orm")

    class _IntegrityError(Exception):
        pass

    def _joinedload(*_args, **_kwargs):  # pragma: no cover - simple stub
        return None

    sqlalchemy_exc.IntegrityError = _IntegrityError
    sqlalchemy_orm.joinedload = _joinedload
    sqlalchemy_module.exc = sqlalchemy_exc
    sqlalchemy_module.orm = sqlalchemy_orm

    sys.modules["sqlalchemy"] = sqlalchemy_module
    sys.modules["sqlalchemy.exc"] = sqlalchemy_exc
    sys.modules["sqlalchemy.orm"] = sqlalchemy_orm


class _Schedule:  # pragma: no cover - placeholders for import compatibility
    pass


class _Student:  # pragma: no cover - placeholders for import compatibility
    pass


class _Availability:  # pragma: no cover - placeholders for import compatibility
    pass


class _FinalizedSchedule:  # pragma: no cover - placeholders for import compatibility
    pass


models_models.Schedule = _Schedule
models_models.Student = _Student
models_models.Availability = _Availability
models_models.FinalizedSchedule = _FinalizedSchedule

sys.modules["models.models"] = models_models
setattr(sys.modules["models"], "models", models_models)

from server.services import schedule_service


class _QueryStub:
    def __init__(self, mapping):
        self._mapping = mapping

    def get(self, key):
        return self._mapping.get(key)


def _make_student(student_id: int, name: str = "Student", lesson_length: int = 60):
    return SimpleNamespace(id=student_id, name=f"{name} {student_id}", lesson_length=lesson_length)


def _make_teacher_availability(start_time, teacher_id):
    return SimpleNamespace(
        id=None,
        start_time=start_time,
        teacher_id=teacher_id,
        student_id=None,
        schedule_id=1,
    )


def _make_student_availability(start_time, student_id):
    return SimpleNamespace(
        id=None,
        start_time=start_time,
        teacher_id=None,
        student_id=student_id,
        schedule_id=1,
    )


def _patch_schedule(monkeypatch, schedule):
    mapping = {schedule.id: schedule}
    stub = SimpleNamespace(query=_QueryStub(mapping))
    monkeypatch.setattr(schedule_service, "Schedule", stub)


@pytest.fixture
def teacher_id():
    return 42


def test_generate_schedule_prefers_fewer_days(monkeypatch, teacher_id):
    day_one_start = datetime(2024, 1, 1, 9, 0)
    day_two_start = datetime(2024, 1, 2, 9, 0)

    students = [_make_student(1), _make_student(2)]

    availabilities = [
        _make_teacher_availability(day_one_start, teacher_id),
        _make_teacher_availability(day_one_start + timedelta(hours=1), teacher_id),
        _make_teacher_availability(day_two_start, teacher_id),
        _make_teacher_availability(day_two_start + timedelta(hours=1), teacher_id),
        _make_student_availability(day_one_start, 1),
        _make_student_availability(day_two_start, 1),
        _make_student_availability(day_one_start + timedelta(hours=1), 2),
        _make_student_availability(day_two_start + timedelta(hours=1), 2),
    ]

    schedule = SimpleNamespace(
        id=1,
        teacher_id=teacher_id,
        days=json.dumps([day_one_start.date().isoformat(), day_two_start.date().isoformat()]),
        dates=[day_one_start.date().isoformat(), day_two_start.date().isoformat()],
        students=students,
        availabilities=availabilities,
    )

    _patch_schedule(monkeypatch, schedule)

    result = schedule_service.generate_schedule(1, slot_minutes=60, day_open_cost=10_000)

    assert len(result["lessons"]) == 2
    lesson_days = {lesson["day"] for lesson in result["lessons"]}
    assert lesson_days == {day_one_start.date().isoformat()}
    assert result["scheduled_count"] == 2
    assert result["unscheduled_student_ids"] == []


def test_generate_schedule_penalizes_gaps(monkeypatch, teacher_id):
    day_start = datetime(2024, 1, 3, 9, 0)

    students = [_make_student(1), _make_student(2)]

    availabilities = [
        _make_teacher_availability(day_start + timedelta(hours=offset), teacher_id)
        for offset in range(3)
    ]
    availabilities.extend(
        [
            _make_student_availability(day_start, 1),
            _make_student_availability(day_start + timedelta(hours=2), 1),
            _make_student_availability(day_start, 2),
            _make_student_availability(day_start + timedelta(hours=1), 2),
        ]
    )

    schedule = SimpleNamespace(
        id=2,
        teacher_id=teacher_id,
        days=json.dumps([day_start.date().isoformat()]),
        dates=[day_start.date().isoformat()],
        students=students,
        availabilities=availabilities,
    )

    _patch_schedule(monkeypatch, schedule)

    result = schedule_service.generate_schedule(2, slot_minutes=60, gap_penalty=10)

    assigned_times = [lesson["start_time"] for lesson in result["lessons"]]
    assert assigned_times == [
        (day_start).isoformat(),
        (day_start + timedelta(hours=1)).isoformat(),
    ]


def test_generate_schedule_reports_unscheduled_students(monkeypatch, teacher_id):
    day_start = datetime(2024, 1, 4, 9, 0)

    students = [_make_student(1), _make_student(2), _make_student(3)]

    availabilities = [
        _make_teacher_availability(day_start, teacher_id),
        _make_teacher_availability(day_start + timedelta(hours=1), teacher_id),
        _make_student_availability(day_start, 1),
        _make_student_availability(day_start + timedelta(hours=1), 2),
        _make_student_availability(day_start + timedelta(days=1), 3),
    ]

    schedule = SimpleNamespace(
        id=3,
        teacher_id=teacher_id,
        days=json.dumps([
            day_start.date().isoformat(),
            (day_start + timedelta(days=1)).date().isoformat(),
        ]),
        dates=[
            day_start.date().isoformat(),
            (day_start + timedelta(days=1)).date().isoformat(),
        ],
        students=students,
        availabilities=availabilities,
    )

    _patch_schedule(monkeypatch, schedule)

    result = schedule_service.generate_schedule(3, slot_minutes=60)

    assert len(result["lessons"]) == 2
    assert result["scheduled_count"] == 2
    assert result["unscheduled_student_ids"] == [3]
