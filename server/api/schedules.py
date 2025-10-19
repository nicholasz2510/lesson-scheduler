from flask import Blueprint, jsonify
from services import schedule_service
from schemas.schedule_schema import schedules_schema

schedules_bp = Blueprint('schedules_bp', __name__, url_prefix='/api/schedules')

@schedules_bp.route('/', methods=['GET'])
def get_schedules():
    try:
        schedules = schedule_service.get_all_schedules()
        
        result = schedules_schema.dump(schedules)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500