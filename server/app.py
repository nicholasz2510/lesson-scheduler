import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from database import db
from models import Teacher, Schedule, Student, Availability, FinalizedSchedule

load_dotenv()

def create_app():
    app = Flask(__name__)

    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST')
    db_name = os.environ.get('DB_NAME')

    uri = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    @app.route('/')
    def index():
        return "yuhhhh"

    @app.route('/api/teachers')
    def get_teachers():
        try:
            teachers = Teacher.query.all()
            
            teachers_list = [
                {
                    "id": teacher.id,
                    "name": teacher.name,
                    "email": teacher.email
                }
                for teacher in teachers
            ]
            
            return jsonify(teachers_list)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app

app = create_app()

