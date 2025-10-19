from flask import Blueprint, jsonify, request

from schemas.student_schema import student_schema, students_schema
from services import student_service
from .auth_decorator import token_required

students_bp = Blueprint('students_bp', __name__, url_prefix='/api/students')


@students_bp.route('/', methods=['GET'])
@token_required
def get_students(current_teacher_id):
    try:
        schedule_id = request.args.get('schedule_id', type=int)
        students = student_service.get_all_students(current_teacher_id, schedule_id)
        result = students_schema.dump(students)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route('/', methods=['POST'])
@token_required
def create_student(current_teacher_id):
    data = request.get_json() or {}
    try:
        student = student_service.create_student(data, current_teacher_id)
        return jsonify(student_schema.dump(student)), 201
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route('/<int:student_id>', methods=['PUT'])
@token_required
def update_student(current_teacher_id, student_id):
    data = request.get_json() or {}
    try:
        student = student_service.update_student(student_id, current_teacher_id, data)
        return jsonify(student_schema.dump(student)), 200
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route('/<int:student_id>', methods=['DELETE'])
@token_required
def delete_student(current_teacher_id, student_id):
    try:
        student_service.delete_student(student_id, current_teacher_id)
        return '', 204
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
