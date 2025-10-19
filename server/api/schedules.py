from flask import Blueprint, jsonify, request

from schemas.schedule_schema import (
    schedule_detail_schema,
    schedule_public_schema,
    schedules_schema,
)
from services import schedule_service
from .auth_decorator import token_required

schedules_bp = Blueprint('schedules_bp', __name__, url_prefix='/api/schedules')


@schedules_bp.route('/', methods=['GET'])
@token_required
def get_schedules(current_teacher_id):
    try:
        schedules = schedule_service.list_teacher_schedules(current_teacher_id)
        result = schedules_schema.dump(schedules)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@schedules_bp.route('/', methods=['POST'])
@token_required
def create_schedule(current_teacher_id):
    data = request.get_json() or {}
    try:
        schedule = schedule_service.create_schedule(data, current_teacher_id)
        return jsonify(schedule_detail_schema.dump(schedule)), 201
    except (ValueError, LookupError) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@schedules_bp.route('/<int:schedule_id>', methods=['GET'])
@token_required
def get_schedule(current_teacher_id, schedule_id):
    schedule = schedule_service.get_schedule(schedule_id, current_teacher_id)
    if schedule is None:
        return jsonify({"error": "Schedule not found"}), 404
    return jsonify(schedule_detail_schema.dump(schedule)), 200


@schedules_bp.route('/<int:schedule_id>', methods=['PUT'])
@token_required
def update_schedule(current_teacher_id, schedule_id):
    data = request.get_json() or {}
    try:
        schedule = schedule_service.update_schedule(schedule_id, current_teacher_id, data)
        return jsonify(schedule_detail_schema.dump(schedule)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@schedules_bp.route('/<int:schedule_id>', methods=['DELETE'])
@token_required
def delete_schedule(current_teacher_id, schedule_id):
    try:
        schedule_service.delete_schedule(schedule_id, current_teacher_id)
        return '', 204
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@schedules_bp.route('/<string:slug>/public', methods=['GET'])
def get_public_schedule(slug):
    schedule = schedule_service.get_schedule_by_slug(slug)
    if schedule is None:
        return jsonify({"error": "Schedule not found"}), 404
    return jsonify(schedule_public_schema.dump(schedule)), 200


@schedules_bp.route('/<int:schedule_id>/finalize', methods=['POST'])
@token_required
def finalize_schedule(current_teacher_id, schedule_id):
    data = request.get_json() or {}
    try:
        entries = data.get('entries') or []
        schedule = schedule_service.finalize_schedule(schedule_id, current_teacher_id, entries)
        return jsonify(schedule_detail_schema.dump(schedule)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
