from sqlalchemy.exc import IntegrityError

from extensions import db
from models.models import RevokedToken, Teacher


def get_all_teachers():
    return Teacher.query.all()


def get_teacher_by_id(teacher_id: int):
    return Teacher.query.get(teacher_id)


def revoke_token(jti: str):
    if not jti:
        return None

    token = RevokedToken(jti=jti)
    try:
        db.session.add(token)
        db.session.commit()
        return token
    except IntegrityError:
        db.session.rollback()
        return RevokedToken.query.filter_by(jti=jti).first()


def is_token_revoked(jti: str) -> bool:
    if not jti:
        return False
    return RevokedToken.query.filter_by(jti=jti).first() is not None
