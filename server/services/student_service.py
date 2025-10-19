from models.models import Student

def get_all_students():
    return Student.query.all()