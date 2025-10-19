from flask import Blueprint, jsonify
from services import student_service
from schemas.student_schema import students_schema

students_bp = Blueprint('students_bp', __name__, url_prefix='/api/students')

@students_bp.route('/', methods=['GET'])
def get_students():
    try:
        students = student_service.get_all_students()
        result = students_schema.dump(students)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500