from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.models import Schedule

class ScheduleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Schedule
        load_instance = True
        include_fk = True
        fields = ("id", "title", "days", "teacher_id") 

schedule_schema = ScheduleSchema()
schedules_schema = ScheduleSchema(many=True)