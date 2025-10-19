from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

from models.models import Schedule
from schemas.availability_schema import AvailabilitySchema
from schemas.finalized_schedule_schema import FinalizedScheduleSchema
from schemas.student_schema import StudentSchema


class ScheduleSchema(SQLAlchemyAutoSchema):
    dates = fields.Method("get_dates")
    finalized_at = auto_field(dump_only=True)
    student_count = fields.Method("get_student_count")
    submitted_count = fields.Method("get_submitted_count")
    pending_students = fields.Method("get_pending_students")

    class Meta:
        model = Schedule
        load_instance = True
        include_fk = True
        fields = (
            "id",
            "title",
            "slug",
            "dates",
            "start_time",
            "end_time",
            "is_finalized",
            "finalized_at",
            "teacher_id",
            "student_count",
            "submitted_count",
            "pending_students",
        )

    def get_dates(self, obj):
        return obj.dates

    def get_student_count(self, obj):
        students = getattr(obj, 'students', None)
        if students is None:
            return 0
        return len(students)

    def get_submitted_count(self, obj):
        availabilities = getattr(obj, 'availabilities', None) or []
        submitted_student_ids = {
            availability.student_id
            for availability in availabilities
            if availability.student_id is not None
        }
        return len(submitted_student_ids)

    def get_pending_students(self, obj):
        students = getattr(obj, 'students', None) or []
        if not students:
            return []

        availabilities = getattr(obj, 'availabilities', None) or []
        submitted_student_ids = {
            availability.student_id
            for availability in availabilities
            if availability.student_id is not None
        }

        return [student.name for student in students if student.id not in submitted_student_ids]


class ScheduleDetailSchema(ScheduleSchema):
    students = fields.Nested(StudentSchema, many=True)
    availabilities = fields.Nested(AvailabilitySchema, many=True)
    finalized_entries = fields.Nested(FinalizedScheduleSchema, many=True)

    class Meta(ScheduleSchema.Meta):
        fields = ScheduleSchema.Meta.fields + (
            "students",
            "availabilities",
            "finalized_entries",
        )


class SchedulePublicSchema(ScheduleSchema):
    students = fields.Nested(StudentSchema, many=True)
    availabilities = fields.Nested(AvailabilitySchema, many=True)

    class Meta(ScheduleSchema.Meta):
        fields = (
            "id",
            "title",
            "slug",
            "dates",
            "start_time",
            "end_time",
            "students",
            "availabilities",
        )


schedule_schema = ScheduleSchema()
schedules_schema = ScheduleSchema(many=True)
schedule_detail_schema = ScheduleDetailSchema()
schedules_detail_schema = ScheduleDetailSchema(many=True)
schedule_public_schema = SchedulePublicSchema()
