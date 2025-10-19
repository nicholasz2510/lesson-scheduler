from models.models import Schedule

def get_all_schedules():
    return Schedule.query.all()