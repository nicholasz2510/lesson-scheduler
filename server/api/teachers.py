from datetime import datetime, timedelta
from uuid import uuid4

from flask import Blueprint, jsonify, request, current_app, g
import jwt

from extensions import db, bcrypt
from models.models import Teacher
from schemas.teacher_schema import teacher_schema, teachers_schema
from services import teacher_service
from .auth_decorator import token_required

teachers_bp = Blueprint('teachers_bp', __name__, url_prefix='/api/teachers')


@teachers_bp.route('/register', methods=['POST'])
def register_teacher():
    data = request.get_json()

    if not data or not all(k in data for k in ('name', 'email', 'password')):
        return jsonify({"error": "Missing name, email, or password"}), 400

    email = data.get('email')
    password = data.get('password')

    if Teacher.query.filter_by(email=email).first():
        return jsonify({"error": "Email address already in use"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_teacher = Teacher(
        name=data.get('name'),
        email=email,
        password=hashed_password
    )

    try:
        db.session.add(new_teacher)
        db.session.commit()
        result = teacher_schema.dump(new_teacher)
        return jsonify({"message": "Account created successfully", "teacher": result}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create account", "details": str(e)}), 500


@teachers_bp.route('/login', methods=['POST'])
def login_teacher():
    data = request.get_json()

    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify({"error": "Missing email or password"}), 400

    email = data.get('email')
    password = data.get('password')

    teacher = Teacher.query.filter_by(email=email).first()

    if not teacher or not bcrypt.check_password_hash(teacher.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    payload = {
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1),
        'teacher_id': teacher.id,
        'jti': str(uuid4())
    }

    token = jwt.encode(
        payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )

    return jsonify({"token": token, "teacher": teacher_schema.dump(teacher)}), 200


@teachers_bp.route('/logout', methods=['POST'])
@token_required
def logout_teacher(current_teacher_id):
    try:
        teacher_service.revoke_token(g.token_jti)
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@teachers_bp.route('/me', methods=['GET'])
@token_required
def get_current_teacher(current_teacher_id):
    teacher = teacher_service.get_teacher_by_id(current_teacher_id)
    if teacher is None:
        return jsonify({"error": "Teacher not found"}), 404
    return jsonify(teacher_schema.dump(teacher)), 200


@teachers_bp.route('/', methods=['GET'])
def get_teachers():
    try:
        teachers = teacher_service.get_all_teachers()
        result = teachers_schema.dump(teachers)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
