from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


class Institution(db.Model):
    __tablename__ = "institutions"
    id = db.Column(db.Integer, primary_key=True)
    institution_code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    name = db.Column(db.String(160), nullable=False)
    short_name = db.Column(db.String(20), nullable=False, default="")
    email = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(40), default="")
    address = db.Column(db.String(240), default="")
    city = db.Column(db.String(100), default="")
    academic_year = db.Column(db.String(30), default="2026-2027")
    currency_symbol = db.Column(db.String(4), default="$")
    subscription_plan = db.Column(db.String(32), default="Enterprise")
    annual_license_fee = db.Column(db.Float, default=18000.0)
    status = db.Column(db.String(20), default="active", nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, index=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_code = db.Column(db.String(40), nullable=False, default="INSTITUTION_ADMIN")
    status = db.Column(db.String(20), nullable=False, default="active")
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True)
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class LoginHistory(db.Model):
    __tablename__ = "login_history"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    identifier = db.Column(db.String(160), nullable=False)
    outcome = db.Column(db.String(24), nullable=False)
    ip_address = db.Column(db.String(64), default="")
    reason = db.Column(db.String(240), default="")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class Student(db.Model):
    __tablename__ = "students"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_code = db.Column(db.String(40), nullable=False)
    admission_number = db.Column(db.String(40), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(40), default="")
    guardian_name = db.Column(db.String(120), default="")
    status = db.Column(db.String(24), default="active")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class Teacher(db.Model):
    __tablename__ = "teachers"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_code = db.Column(db.String(40), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False)
    department = db.Column(db.String(80), default="General")
    qualification = db.Column(db.String(120), default="")
    performance_rating = db.Column(db.Float, default=4.5)
    status = db.Column(db.String(24), default="active")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class Staff(db.Model):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    staff_code = db.Column(db.String(40), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False)
    department = db.Column(db.String(80), nullable=False)
    designation = db.Column(db.String(80), nullable=False)
    monthly_salary = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(24), default="active")


class Attendance(db.Model):
    __tablename__ = "attendance"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = db.Column(db.String(16), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=True)
    attendance_date = db.Column(db.String(16), nullable=False, index=True)
    status = db.Column(db.String(16), nullable=False)
    remarks = db.Column(db.String(200), default="")


class Fee(db.Model):
    __tablename__ = "fees"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    net_amount = db.Column(db.Float, nullable=False)
    paid_amount = db.Column(db.Float, default=0.0)
    due_date = db.Column(db.String(16), nullable=False)
    status = db.Column(db.String(20), default="pending")


class Examination(db.Model):
    __tablename__ = "examinations"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(140), nullable=False)
    exam_type = db.Column(db.String(40), default="Midterm")
    start_date = db.Column(db.String(16), nullable=False)
    end_date = db.Column(db.String(16), nullable=False)
    status = db.Column(db.String(20), default="scheduled")


class Result(db.Model):
    __tablename__ = "results"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    examination_id = db.Column(db.Integer, db.ForeignKey("examinations.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_name = db.Column(db.String(120), nullable=False)
    marks_obtained = db.Column(db.Float, nullable=False)
    max_marks = db.Column(db.Float, default=100.0)
    percentage = db.Column(db.Float, nullable=False)
    grade = db.Column(db.String(8), nullable=False)


class TimetableSlot(db.Model):
    __tablename__ = "timetables"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = db.Column(db.String(16), nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    subject_name = db.Column(db.String(120), nullable=False)
    room_number = db.Column(db.String(40), default="")


class Notice(db.Model):
    __tablename__ = "notices"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, index=True)
    title = db.Column(db.String(160), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(24), default="announcement")
    priority = db.Column(db.String(16), default="normal")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class LibraryBook(db.Model):
    __tablename__ = "library_books"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    isbn = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(180), nullable=False)
    author = db.Column(db.String(120), nullable=False)
    total_copies = db.Column(db.Integer, default=1)
    available_copies = db.Column(db.Integer, default=1)


class TransportRoute(db.Model):
    __tablename__ = "transport_routes"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    route_code = db.Column(db.String(24), nullable=False)
    route_name = db.Column(db.String(120), nullable=False)
    vehicle_number = db.Column(db.String(40), nullable=False)
    driver_name = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer, default=40)
    monthly_fee = db.Column(db.Float, default=150.0)


class Parent(db.Model):
    __tablename__ = "parents"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(40), default="")
    occupation = db.Column(db.String(80), default="")


class Certificate(db.Model):
    __tablename__ = "certificates"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    certificate_number = db.Column(db.String(64), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    certificate_type = db.Column(db.String(40), nullable=False)
    issue_date = db.Column(db.String(16), nullable=False)
    remarks = db.Column(db.String(300), default="")
    status = db.Column(db.String(20), default="issued")


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.Integer, primary_key=True)
    institution_id = db.Column(db.Integer, nullable=True, index=True)
    actor_name = db.Column(db.String(120), nullable=False)
    actor_role = db.Column(db.String(40), nullable=False)
    action = db.Column(db.String(64), nullable=False)
    details = db.Column(db.String(400), default="")
    ip_address = db.Column(db.String(64), default="")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
