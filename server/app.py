import os
from flask import Flask, jsonify
from dotenv import load_dotenv

from database import db
# Import all the new models from models.py
from models import Teacher, Schedule, Student, Availability, FinalizedSchedule

load_dotenv()

def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST')
    db_name = os.environ.get('DB_NAME')

    # --- DEBUG PRINTS ---
    print("--- Loading DB Config ---")
    print(f"DB_HOST: {db_host}")
    print(f"DB_USER: {db_user}")
    print(f"DB_NAME: {db_name}")
    print(f"DB_PASSWORD is {'SET' if db_password else 'NOT SET'}")
    print("-------------------------")

    uri = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    @app.route('/')
    def index():
        return "App is running!"

    # --- API Test Route ---
    @app.route('/api/teachers')
    def get_teachers():
        try:
            # Query all teachers from the database
            teachers = Teacher.query.all()
            
            # Serialize the list of teachers into a list of dictionaries
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
            # Basic error handling
            return jsonify({"error": str(e)}), 500

    return app

app = create_app()

