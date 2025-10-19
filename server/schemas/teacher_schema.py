from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models.models import Teacher

class TeacherSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Teacher
        load_instance = True  
        fields = ("id", "name", "email") 

teacher_schema = TeacherSchema()
teachers_schema = TeacherSchema(many=True)