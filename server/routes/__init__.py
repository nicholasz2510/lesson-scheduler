"""Route blueprints for the Lesson Scheduler server."""

from .student import student_blueprint
from .teacher import teacher_blueprint

__all__ = ["student_blueprint", "teacher_blueprint"]
