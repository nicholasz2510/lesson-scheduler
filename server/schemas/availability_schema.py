from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from models.models import Availability


class AvailabilitySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Availability
        load_instance = True
        include_fk = True
        fields = ("id", "start_time", "schedule_id", "student_id", "teacher_id")


availability_schema = AvailabilitySchema()
availabilities_schema = AvailabilitySchema(many=True)
