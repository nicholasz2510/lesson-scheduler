from datetime import datetime
from typing import Iterable, List, Optional

from extensions import db
from models.models import Availability, Schedule, Student


def _parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace('Z', '+00:00')
        try:
            return datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError(f'Invalid datetime value: {value}') from exc
    raise ValueError('start_time must be a datetime string.')


def get_all_availabilities() -> List[Availability]:
    return Availability.query.all()


def get_availabilities_for_schedule(schedule_id: int, teacher_id: Optional[int] = None) -> List[Availability]:
    if teacher_id is not None:
        schedule = Schedule.query.filter_by(id=schedule_id, teacher_id=teacher_id).first()
        if schedule is None:
            raise PermissionError('Teacher is not authorized for this schedule.')

    query = Availability.query.filter_by(schedule_id=schedule_id)
    return query.order_by(Availability.start_time.asc()).all()


def create_availability(data: dict) -> Availability:
    schedule_id = data.get('schedule_id')
    if not schedule_id:
        raise ValueError('schedule_id is required.')

    schedule = Schedule.query.filter_by(id=schedule_id).first()
    if schedule is None:
        raise LookupError('Schedule not found.')

    student_id = data.get('student_id')
    teacher_id = data.get('teacher_id')

    if student_id is not None:
        student = Student.query.filter_by(id=student_id, schedule_id=schedule_id).first()
        if student is None:
            raise LookupError('Student not found for this schedule.')

    if teacher_id is not None and teacher_id != schedule.teacher_id:
        raise PermissionError('Teacher is not authorized for this schedule.')

    start_time = _parse_datetime(data.get('start_time'))

    availability = Availability(
        start_time=start_time,
        schedule_id=schedule_id,
        student_id=student_id,
        teacher_id=teacher_id,
    )

    try:
        db.session.add(availability)
        db.session.commit()
        return availability
    except Exception:
        db.session.rollback()
        raise


def update_availability(availability_id: int, data: dict, teacher_id: Optional[int] = None) -> Availability:
    availability = Availability.query.get(availability_id)
    if availability is None:
        raise LookupError('Availability not found.')

    schedule = Schedule.query.filter_by(id=availability.schedule_id).first()
    if schedule is None:
        raise LookupError('Schedule not found.')

    if teacher_id is not None and schedule.teacher_id != teacher_id:
        raise PermissionError('Teacher is not authorized for this schedule.')

    if 'start_time' in data:
        availability.start_time = _parse_datetime(data.get('start_time'))

    if 'student_id' in data:
        student_id = data.get('student_id')
        if student_id is not None:
            student = Student.query.filter_by(id=student_id, schedule_id=availability.schedule_id).first()
            if student is None:
                raise LookupError('Student not found for this schedule.')
        availability.student_id = student_id

    if 'teacher_id' in data:
        teacher_id_value = data.get('teacher_id')
        if teacher_id_value is not None and teacher_id_value != schedule.teacher_id:
            raise PermissionError('Teacher is not authorized for this schedule.')
        availability.teacher_id = teacher_id_value

    try:
        db.session.commit()
        return availability
    except Exception:
        db.session.rollback()
        raise


def replace_teacher_availability(
    schedule_id: int,
    teacher_id: int,
    start_times: Iterable,
) -> List[Availability]:
    if not schedule_id:
        raise ValueError('schedule_id is required.')

    schedule = Schedule.query.filter_by(id=schedule_id, teacher_id=teacher_id).first()
    if schedule is None:
        raise LookupError('Schedule not found for this teacher.')

    parsed_times = [_parse_datetime(value) for value in start_times]
    unique_times = sorted({item for item in parsed_times})

    try:
        Availability.query.filter_by(
            schedule_id=schedule_id,
            teacher_id=teacher_id,
        ).delete()

        created: List[Availability] = []
        for start_time in unique_times:
            availability = Availability(
                start_time=start_time,
                schedule_id=schedule_id,
                teacher_id=teacher_id,
            )
            db.session.add(availability)
            created.append(availability)

        db.session.commit()
        return created
    except Exception:
        db.session.rollback()
        raise


def replace_student_availability(
    schedule_id: int,
    student_id: int,
    start_times: Iterable,
) -> List[Availability]:
    if not schedule_id:
        raise ValueError('schedule_id is required.')
    if not student_id:
        raise ValueError('student_id is required.')

    student = Student.query.filter_by(id=student_id, schedule_id=schedule_id).first()
    if student is None:
        raise LookupError('Student not found for this schedule.')

    parsed_times = [_parse_datetime(value) for value in start_times]
    unique_times = sorted({item for item in parsed_times})

    try:
        Availability.query.filter_by(
            schedule_id=schedule_id,
            student_id=student_id,
        ).delete()

        created: List[Availability] = []
        for start_time in unique_times:
            availability = Availability(
                start_time=start_time,
                schedule_id=schedule_id,
                student_id=student_id,
            )
            db.session.add(availability)
            created.append(availability)

        db.session.commit()
        return created
    except Exception:
        db.session.rollback()
        raise
