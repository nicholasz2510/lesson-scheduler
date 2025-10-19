from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.models import Student

class StudentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Student
        load_instance = True
        include_fk = True
        fields = ("id", "name", "lesson_length", "schedule_id")

student_schema = StudentSchema()
students_schema = StudentSchema(many=True)