from flask import Blueprint, jsonify
from services import availability_service
from schemas.availability_schema import availabilities_schema

availabilities_bp = Blueprint('availabilities_bp', __name__, url_prefix='/api/availabilities')

@availabilities_bp.route('/', methods=['GET'])
def get_availabilities():
    try:
        availabilities = availability_service.get_all_availabilities()
        result = availabilities_schema.dump(availabilities)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500