import re
from collections.abc import Iterable
from datetime import datetime
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from extensions import db
from models.models import FinalizedSchedule, Schedule, Student


def _slugify(value: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', (value or '').lower()).strip('-')
    return base or 'schedule'


def _ensure_unique_slug(slug: str, schedule_id: Optional[int] = None) -> str:
    base = slug
    counter = 1
    while True:
        query = Schedule.query.filter(Schedule.slug == slug)
        if schedule_id is not None:
            query = query.filter(Schedule.id != schedule_id)
        if query.first() is None:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def list_teacher_schedules(teacher_id: int) -> List[Schedule]:
    return (
        Schedule.query.filter_by(teacher_id=teacher_id)
        .order_by(Schedule.created_at.desc())
        .all()
    )


def get_schedule(schedule_id: int, teacher_id: Optional[int] = None) -> Optional[Schedule]:
    query = Schedule.query.options(
        joinedload(Schedule.students),
        joinedload(Schedule.availabilities),
        joinedload(Schedule.finalized_entries),
    ).filter_by(id=schedule_id)

    if teacher_id is not None:
        query = query.filter_by(teacher_id=teacher_id)

    return query.first()


def get_schedule_by_slug(slug: str) -> Optional[Schedule]:
    return (
        Schedule.query.options(joinedload(Schedule.students))
        .filter_by(slug=slug)
        .first()
    )


def create_schedule(data: dict, teacher_id: int) -> Schedule:
    title = (data.get('title') or '').strip()
    if not title:
        raise ValueError('Title is required.')

    dates_value = data.get('dates') or []
    if not isinstance(dates_value, Iterable):
        raise ValueError('At least one date is required.')

    dates_list = list(dates_value)
    if not dates_list:
        raise ValueError('At least one date is required.')

    start_time = data.get('start_time')
    end_time = data.get('end_time')

    incoming_slug = data.get('slug') or _slugify(title)
    slug = _ensure_unique_slug(incoming_slug)

    schedule = Schedule(
        title=title,
        slug=slug,
        start_time=start_time,
        end_time=end_time,
        teacher_id=teacher_id,
    )
    schedule.dates = dates_list

    try:
        db.session.add(schedule)
        db.session.flush()

        for student_payload in data.get('students') or []:
            name = (student_payload.get('name') or '').strip() or 'Unnamed student'
            lesson_length = student_payload.get('lesson_length') or 30
            try:
                lesson_length = int(lesson_length)
            except (TypeError, ValueError):
                lesson_length = 30

            student = Student(
                name=name,
                lesson_length=lesson_length,
                schedule_id=schedule.id,
            )
            db.session.add(student)

        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except Exception:
        db.session.rollback()
        raise


def update_schedule(schedule_id: int, teacher_id: int, data: dict) -> Schedule:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    if 'title' in data:
        title = (data.get('title') or '').strip()
        if not title:
            raise ValueError('Title cannot be empty.')
        schedule.title = title

    if 'dates' in data:
        dates_value = data.get('dates') or []
        if not isinstance(dates_value, Iterable):
            raise ValueError('At least one date is required.')

        dates_list = list(dates_value)
        if not dates_list:
            raise ValueError('At least one date is required.')
        schedule.dates = dates_list

    if 'start_time' in data:
        schedule.start_time = data.get('start_time')

    if 'end_time' in data:
        schedule.end_time = data.get('end_time')

    if 'slug' in data and data['slug']:
        new_slug = _ensure_unique_slug(data['slug'], schedule_id=schedule.id)
        schedule.slug = new_slug

    try:
        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except IntegrityError:
        db.session.rollback()
        raise ValueError('Schedule slug must be unique.')
    except Exception:
        db.session.rollback()
        raise


def delete_schedule(schedule_id: int, teacher_id: int) -> None:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    try:
        db.session.delete(schedule)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def _parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace('Z', '+00:00')
        try:
            return datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError(f'Invalid datetime value: {value}') from exc
    raise ValueError('Datetime value is required.')


def finalize_schedule(schedule_id: int, teacher_id: int, entries: List[dict]) -> Schedule:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    if not isinstance(entries, list) or not entries:
        raise ValueError('Finalized entries are required.')

    try:
        FinalizedSchedule.query.filter_by(schedule_id=schedule.id).delete()

        for entry in entries:
            student_id = entry.get('student_id')
            if not student_id:
                raise ValueError('Each finalized entry requires a student_id.')

            student = Student.query.filter_by(id=student_id, schedule_id=schedule.id).first()
            if student is None:
                raise ValueError('Student does not belong to this schedule.')

            start_time = _parse_datetime(entry.get('start_time'))
            end_time = _parse_datetime(entry.get('end_time'))

            record = FinalizedSchedule(
                schedule_id=schedule.id,
                student_id=student.id,
                teacher_id=teacher_id,
                start_time=start_time,
                end_time=end_time,
            )
            db.session.add(record)

        schedule.is_finalized = True
        schedule.finalized_at = datetime.utcnow()
        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except Exception:
        db.session.rollback()
        raise
