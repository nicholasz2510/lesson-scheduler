from flask import Flask
from dotenv import load_dotenv

from extensions import db
from config import DevelopmentConfig
from api.teachers import teachers_bp
from api.schedules import schedules_bp
from api.students import students_bp
from api.availabilities import availabilities_bp
from api.finalized_schedules import finalized_schedules_bp

load_dotenv()

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)

    app.config.from_object(config_class)

    db.init_app(app)

    app.register_blueprint(teachers_bp)
    app.register_blueprint(schedules_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(availabilities_bp)
    app.register_blueprint(finalized_schedules_bp)

    @app.route('/')
    def index():
        return "App is running!"

    return app

app = create_app()