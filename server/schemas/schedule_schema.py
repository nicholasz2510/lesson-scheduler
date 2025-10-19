from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

from models.models import Schedule
from schemas.availability_schema import AvailabilitySchema
from schemas.finalized_schedule_schema import FinalizedScheduleSchema
from schemas.student_schema import StudentSchema


class ScheduleSchema(SQLAlchemyAutoSchema):
    dates = fields.Method("get_dates")
    finalized_at = auto_field(dump_only=True)

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
        )

    def get_dates(self, obj):
        return obj.dates


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

    class Meta(ScheduleSchema.Meta):
        fields = (
            "id",
            "title",
            "slug",
            "dates",
            "start_time",
            "end_time",
            "students",
        )


schedule_schema = ScheduleSchema()
schedules_schema = ScheduleSchema(many=True)
schedule_detail_schema = ScheduleDetailSchema()
schedules_detail_schema = ScheduleDetailSchema(many=True)
schedule_public_schema = SchedulePublicSchema()
