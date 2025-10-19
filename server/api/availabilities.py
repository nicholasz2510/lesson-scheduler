from flask import Blueprint, jsonify, request

from schemas.availability_schema import availability_schema, availabilities_schema
from services import availability_service
from .auth_decorator import token_required

availabilities_bp = Blueprint('availabilities_bp', __name__, url_prefix='/api/availabilities')


@availabilities_bp.route('/', methods=['POST'])
def create_availability():
    data = request.get_json() or {}
    try:
        availability = availability_service.create_availability(data)
        return jsonify(availability_schema.dump(availability)), 201
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@availabilities_bp.route('/<int:schedule_id>', methods=['GET'])
@token_required
def get_availabilities(current_teacher_id, schedule_id):
    try:
        availabilities = availability_service.get_availabilities_for_schedule(schedule_id, current_teacher_id)
        result = availabilities_schema.dump(availabilities)
        return jsonify(result), 200
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@availabilities_bp.route('/<int:availability_id>', methods=['PUT'])
@token_required
def update_availability(current_teacher_id, availability_id):
    data = request.get_json() or {}
    try:
        availability = availability_service.update_availability(availability_id, data, teacher_id=current_teacher_id)
        return jsonify(availability_schema.dump(availability)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@availabilities_bp.route('/teacher/sync', methods=['POST'])
@token_required
def sync_teacher_availability(current_teacher_id):
    data = request.get_json() or {}
    schedule_id = data.get('schedule_id')
    start_times = data.get('start_times') or []
    try:
        availabilities = availability_service.replace_teacher_availability(
            schedule_id,
            current_teacher_id,
            start_times,
        )
        return jsonify(availabilities_schema.dump(availabilities)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@availabilities_bp.route('/student/sync', methods=['POST'])
def sync_student_availability():
    data = request.get_json() or {}
    schedule_id = data.get('schedule_id')
    student_id = data.get('student_id')
    start_times = data.get('start_times') or []
    try:
        availabilities = availability_service.replace_student_availability(
            schedule_id,
            student_id,
            start_times,
        )
        return jsonify(availabilities_schema.dump(availabilities)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
