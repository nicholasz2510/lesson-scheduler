"""Flask application entrypoint for the Lesson Scheduler backend."""

from flask import Flask, jsonify

from routes.student import student_blueprint
from routes.teacher import teacher_blueprint


def create_app() -> Flask:
    """Create and configure the Flask application instance."""

    app = Flask(__name__)

    register_base_routes(app)
    app.register_blueprint(teacher_blueprint)
    app.register_blueprint(student_blueprint)

    return app


def register_base_routes(app: Flask) -> None:
    """Register routes that are not tied to a specific blueprint."""

    @app.route("/", methods=["GET"])
    def index():
        """Simple health endpoint to verify the API is running."""

        return jsonify({"message": "Lesson Scheduler API"})

    @app.route("/signin", methods=["POST"])
    def signin():
        """Placeholder endpoint for authenticating a user."""

        return (
            jsonify(
                {
                    "message": "Sign-in not implemented yet",
                    "status": "not_implemented",
                }
            ),
            200,
        )

    @app.route("/dashboard", methods=["GET"])
    def dashboard():
        """Placeholder endpoint for fetching dashboard data for the signed-in user."""

        return (
            jsonify(
                {
                    "message": "Dashboard data not implemented yet",
                    "status": "not_implemented",
                }
            ),
            200,
        )


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
