from flask import Blueprint, jsonify
from services import teacher_service
from schemas.teacher_schema import teachers_schema

teachers_bp = Blueprint('teachers_bp', __name__, url_prefix='/api/teachers')

@teachers_bp.route('/', methods=['GET'])
def get_teachers():
    try:
        teachers = teacher_service.get_all_teachers()
        result = teachers_schema.dump(teachers)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500