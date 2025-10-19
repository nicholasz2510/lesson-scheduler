from models.models import Availability

def get_all_availabilities():
    return Availability.query.all()