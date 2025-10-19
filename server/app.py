import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv 
from models import User
from database import db
from models import Teacher, Schedule, Student, Availability, FinalizedSchedule

load_dotenv()

def create_app():
    app = Flask(__name__)

    # --- Configuration ---
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
        return "App is running!"

    return app

app = create_app()