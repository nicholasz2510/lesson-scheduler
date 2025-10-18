from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)


@app.route("/")
def index():
    """Redirect to the sign in page."""
    return redirect(url_for("signin"))


@app.route("/signin")
def signin():
    """Render the sign in template."""
    return render_template("signin.html")


@app.route("/dashboard")
def dashboard():
    """Render the teacher dashboard."""
    return render_template("dashboard.html")


@app.route("/teacher/schedules")
def teacher_schedules():
    """List schedules that the teacher has created."""
    return render_template("teacher_schedules.html")


@app.route("/teacher/schedules/<int:schedule_id>")
def teacher_schedule_detail(schedule_id: int):
    """Display details for a specific teacher schedule."""
    return render_template("teacher_schedule_detail.html", schedule_id=schedule_id)


@app.route("/teacher/create", endpoint="create_schedule")
def create_schedule():
    """Show the scaffolded create schedule flow."""
    return render_template("create_schedule.html")


@app.route("/student/schedules/<int:schedule_id>")
def student_schedule(schedule_id: int):
    """Allow a student to submit their availability for a schedule."""
    return render_template("student_schedule.html", schedule_id=schedule_id)


@app.route("/student/schedules/<int:schedule_id>/confirmation")
def student_confirmation(schedule_id: int):
    """Placeholder for a confirmation page after students submit availability."""
    return render_template("student_confirmation.html", schedule_id=schedule_id)


if __name__ == "__main__":
    app.run(debug=True)
