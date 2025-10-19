from database import db

# Teacher model
class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    # Note: Passwords should always be hashed in a real application.
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    # Define the one-to-many relationship to the Schedule table
    schedules = db.relationship('Schedule', back_populates='teacher', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Teacher {self.name}>'

# Schedule model
class Schedule(db.Model):
    __tablename__ = 'schedule'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    is_full_week = db.Column(db.Boolean, default=False, nullable=False)
    
    # Foreign key to link to the teachers table
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)

    # Relationships
    teacher = db.relationship('Teacher', back_populates='schedules')
    students = db.relationship('Student', back_populates='schedule', cascade="all, delete-orphan")
    availabilities = db.relationship('Availability', back_populates='schedule', cascade="all, delete-orphan")
    finalized_entries = db.relationship('FinalizedSchedule', back_populates='schedule', cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Schedule {self.title}>'

# Student model
class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    lesson_length = db.Column(db.Integer, nullable=False)

    # Foreign key to link to the schedule table
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)

    # Relationship
    schedule = db.relationship('Schedule', back_populates='students')

    def __repr__(self):
        return f'<Student {self.name}>'

# Availability model
class Availability(db.Model):
    __tablename__ = 'availability'
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime(timezone=True), nullable=False)

    # Foreign Keys
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    # A student_id can be null if a teacher is just blocking off available time
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)

    # Relationships
    schedule = db.relationship('Schedule', back_populates='availabilities')
    student = db.relationship('Student')
    teacher = db.relationship('Teacher')

# Finalized Schedule model
class FinalizedSchedule(db.Model):
    __tablename__ = 'finalized_schedule'
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime(timezone=True), nullable=False)
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)

    # Foreign Keys
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    
    # Relationships
    schedule = db.relationship('Schedule', back_populates='finalized_entries')
    student = db.relationship('Student')
    teacher = db.relationship('Teacher')
