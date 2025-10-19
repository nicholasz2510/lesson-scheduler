from models.models import FinalizedSchedule

def get_all_finalized_schedules():
    return FinalizedSchedule.query.all()