from flask import Flask

# Create a Flask application instance
app = Flask(__name__)


# Define a route and its associated view function
@app.route("/")
def hello_world():
    return "Hello, World!"


# Run the application if the script is executed directly
if __name__ == "__main__":
    app.run(debug=True)
