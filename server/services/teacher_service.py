from models.models import Teacher

def get_all_teachers():
    return Teacher.query.all()