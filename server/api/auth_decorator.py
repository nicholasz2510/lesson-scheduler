import jwt
from functools import wraps
from flask import request, jsonify, current_app, g

from services import teacher_service


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None

        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        elif auth_header:
            token = auth_header.strip()

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_teacher_id = data.get('teacher_id') or data.get('sub')
            token_jti = data.get('jti')

            if not current_teacher_id:
                return jsonify({'error': 'Token payload is invalid.'}), 401

            if teacher_service.is_token_revoked(token_jti):
                return jsonify({'error': 'Token has been revoked!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 401

        g.current_teacher_id = current_teacher_id
        g.token_jti = token_jti
        g.raw_token = token

        return f(current_teacher_id=current_teacher_id, *args, **kwargs)

    return decorated
