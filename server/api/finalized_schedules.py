from flask import Blueprint, jsonify
from services import finalized_schedule_service
from schemas.finalized_schedule_schema import finalized_schedules_schema

finalized_schedules_bp = Blueprint('finalized_schedules_bp', __name__, url_prefix='/api/finalized-schedules')

@finalized_schedules_bp.route('/', methods=['GET'])
def get_finalized_schedules():
    try:
        schedules = finalized_schedule_service.get_all_finalized_schedules()
        result = finalized_schedules_schema.dump(schedules)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500