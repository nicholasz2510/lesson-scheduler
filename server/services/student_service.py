from typing import List, Optional

from extensions import db
from models.models import Schedule, Student


def _get_student(student_id: int, teacher_id: int) -> Optional[Student]:
    return (
        Student.query.join(Schedule)
        .filter(Student.id == student_id, Schedule.teacher_id == teacher_id)
        .first()
    )


def get_all_students(teacher_id: int, schedule_id: Optional[int] = None) -> List[Student]:
    query = Student.query.join(Schedule).filter(Schedule.teacher_id == teacher_id)
    if schedule_id is not None:
        query = query.filter(Student.schedule_id == schedule_id)
    return query.order_by(Student.id.asc()).all()


def create_student(data: dict, teacher_id: int) -> Student:
    schedule_id = data.get('schedule_id')
    if not schedule_id:
        raise ValueError('schedule_id is required.')

    schedule = Schedule.query.filter_by(id=schedule_id, teacher_id=teacher_id).first()
    if schedule is None:
        raise LookupError('Schedule not found for this teacher.')

    name = (data.get('name') or '').strip()
    if not name:
        raise ValueError('Student name is required.')

    existing_names = {student.name.lower() for student in schedule.students}
    if name.lower() in existing_names:
        raise ValueError('Student names must be unique within a schedule.')

    lesson_length = data.get('lesson_length') or 30
    try:
        lesson_length = int(lesson_length)
    except (TypeError, ValueError):
        lesson_length = 30

    student = Student(name=name, lesson_length=lesson_length, schedule_id=schedule.id)

    try:
        db.session.add(student)
        db.session.commit()
        return student
    except Exception:
        db.session.rollback()
        raise


def update_student(student_id: int, teacher_id: int, data: dict) -> Student:
    student = _get_student(student_id, teacher_id)
    if student is None:
        raise LookupError('Student not found.')

    if 'name' in data:
        name = (data.get('name') or '').strip()
        if not name:
            raise ValueError('Student name cannot be empty.')

        existing_names = {
            other.name.lower()
            for other in student.schedule.students
            if other.id != student.id
        }
        if name.lower() in existing_names:
            raise ValueError('Student names must be unique within a schedule.')

        student.name = name

    if 'lesson_length' in data:
        try:
            student.lesson_length = int(data.get('lesson_length'))
        except (TypeError, ValueError):
            raise ValueError('lesson_length must be an integer value.')

    if 'schedule_id' in data:
        new_schedule_id = data.get('schedule_id')
        schedule = Schedule.query.filter_by(id=new_schedule_id, teacher_id=teacher_id).first()
        if schedule is None:
            raise LookupError('Target schedule not found for this teacher.')
        student.schedule_id = schedule.id

    try:
        db.session.commit()
        return student
    except Exception:
        db.session.rollback()
        raise


def delete_student(student_id: int, teacher_id: int) -> None:
    student = _get_student(student_id, teacher_id)
    if student is None:
        raise LookupError('Student not found.')

    try:
        db.session.delete(student)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
