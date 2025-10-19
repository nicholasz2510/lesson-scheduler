from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.models import FinalizedSchedule

class FinalizedScheduleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = FinalizedSchedule
        load_instance = True
        include_fk = True
        fields = ("id", "start_time", "end_time", "schedule_id", "student_id", "teacher_id")

finalized_schedule_schema = FinalizedScheduleSchema()
finalized_schedules_schema = FinalizedScheduleSchema(many=True)