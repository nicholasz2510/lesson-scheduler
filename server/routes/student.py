"""Blueprint containing student-facing API routes."""

from flask import Blueprint, jsonify, request

student_blueprint = Blueprint("student", __name__, url_prefix="/student")


@student_blueprint.route("/schedules/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id: str):
    """Placeholder for retrieving the public details of a schedule."""

    return (
        jsonify(
            {
                "message": "Student schedule details not implemented yet",
                "schedule_id": schedule_id,
                "status": "not_implemented",
            }
        ),
        200,
    )


@student_blueprint.route(
    "/schedules/<schedule_id>/students/<student_id>", methods=["GET"]
)
def get_student_entry(schedule_id: str, student_id: str):
    """Placeholder for retrieving information about a specific student in a schedule."""

    return (
        jsonify(
            {
                "message": "Student entry retrieval not implemented yet",
                "schedule_id": schedule_id,
                "student_id": student_id,
                "status": "not_implemented",
            }
        ),
        200,
    )


@student_blueprint.route(
    "/schedules/<schedule_id>/students/<student_id>/availability", methods=["POST"]
)
def submit_availability(schedule_id: str, student_id: str):
    """Placeholder for submitting availability for a student."""

    _payload = request.get_json(silent=True) or {}
    return (
        jsonify(
            {
                "message": "Submitting availability not implemented yet",
                "payload": _payload,
                "schedule_id": schedule_id,
                "student_id": student_id,
                "status": "not_implemented",
            }
        ),
        200,
    )


@student_blueprint.route(
    "/schedules/<schedule_id>/students/<student_id>/submission", methods=["POST"]
)
def finalize_submission(schedule_id: str, student_id: str):
    """Placeholder for marking a student's availability as final."""

    return (
        jsonify(
            {
                "message": "Finalizing submission not implemented yet",
                "schedule_id": schedule_id,
                "student_id": student_id,
                "status": "not_implemented",
            }
        ),
        202,
    )


@student_blueprint.route(
    "/schedules/<schedule_id>/students/<student_id>/assignment", methods=["GET"]
)
def get_assignment(schedule_id: str, student_id: str):
    """Placeholder for retrieving the scheduled lesson assignment for a student."""

    return (
        jsonify(
            {
                "message": "Student assignment retrieval not implemented yet",
                "schedule_id": schedule_id,
                "student_id": student_id,
                "status": "not_implemented",
            }
        ),
        200,
    )
