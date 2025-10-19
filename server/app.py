import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv 
from models import User
from database import db
load_dotenv()


def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    # Get database credentials from environment variables
    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST') 
    db_name = os.environ.get('DB_NAME')

    # Create the database connection URI
    # The format is: dialect+driver://username:password@host/database
    uri = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the app with the database
    db.init_app(app)

    # --- Your routes would go here ---
    @app.route('/')
    def index():
        return "App is running!"

    return app

app = create_app()