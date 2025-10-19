from flask import Blueprint, jsonify
from models.models import FinalizedSchedule
from schemas.finalized_schedule_schema import finalized_schedules_schema
from .auth_decorator import token_required

finalized_schedules_bp = Blueprint('finalized_schedules_bp', __name__, url_prefix='/api/finalized_schedules')

@finalized_schedules_bp.route('/', methods=['GET'])
@token_required
def get_finalized_schedules(current_teacher_id):
    try:
        schedules = FinalizedSchedule.query.filter_by(teacher_id=current_teacher_id).all()
        result = finalized_schedules_schema.dump(schedules)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
