from functools import wraps
import hashlib
import os
import secrets
import shutil
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from flask import Flask, g, jsonify, request, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate

from config import Config
from models import (
    Attendance,
    AuditLog,
    Certificate,
    Examination,
    Fee,
    Institution,
    LibraryBook,
    LoginHistory,
    Notice,
    Parent,
    Result,
    Staff,
    Student,
    Teacher,
    TimetableSlot,
    TransportRoute,
    User,
    db,
)

ph = PasswordHasher()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    Migrate(app, db)
    CORS(app, supports_credentials=True)
    limiter = Limiter(get_remote_address, app=app, default_limits=["300 per minute"])

    with app.app_context():
        db.create_all()

    def record_audit(action: str, details: str = "", inst_id=None):
        user = getattr(g, "current_user", None)
        entry = AuditLog(
            institution_id=inst_id if inst_id is not None else getattr(g, "tenant_id", None),
            actor_name=user.full_name if user else "System",
            actor_role=user.role_code if user else "SYSTEM",
            action=action,
            details=details[:390],
            ip_address=request.remote_addr or "127.0.0.1",
        )
        db.session.add(entry)
        db.session.commit()

    def require_auth(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            uid = session.get("user_id")
            if not uid:
                return jsonify({"error": "Authentication required."}), 401
            user = db.session.get(User, uid)
            if not user or user.status != "active":
                session.clear()
                return jsonify({"error": "Session invalid or suspended."}), 401
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                token = request.headers.get("X-CSRF-Token")
                if not token or token != session.get("csrf_token"):
                    return jsonify({"error": "Invalid CSRF verification token."}), 403
            g.current_user = user
            return fn(*args, **kwargs)
        return wrapper

    def require_founder(fn):
        @wraps(fn)
        @require_auth
        def wrapper(*args, **kwargs):
            if g.current_user.role_code != "FOUNDER_SUPER_ADMIN":
                return jsonify({"error": "Founder Super Admin clearance required."}), 403
            return fn(*args, **kwargs)
        return wrapper

    def require_tenant(fn):
        @wraps(fn)
        @require_auth
        def wrapper(*args, **kwargs):
            user = g.current_user
            req_inst = request.headers.get("X-Institution-Id") or request.args.get("institutionId")
            if user.role_code != "FOUNDER_SUPER_ADMIN":
                if req_inst and int(req_inst) != user.institution_id:
                    record_audit("TENANT_ISOLATION_VIOLATION", f"Blocked cross-tenant read to #{req_inst}")
                    return jsonify({"error": "Cross-tenant access denied."}), 403
                g.tenant_id = user.institution_id
            else:
                if req_inst:
                    g.tenant_id = int(req_inst)
                else:
                    first = Institution.query.order_by(Institution.id.asc()).first()
                    if not first:
                        return jsonify({"error": "No institution exists yet."}), 400
                    g.tenant_id = first.id
            return fn(*args, **kwargs)
        return wrapper

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "AAKNOVA-Flask", "database": app.config["SQLALCHEMY_DATABASE_URI"].split("://")[0]})

    @app.get("/api/auth/setup-status")
    def setup_status():
        has_founder = User.query.filter_by(role_code="FOUNDER_SUPER_ADMIN").count() > 0
        return jsonify({"needsSetup": not has_founder, "platformName": "AAKNOVA"})

    @app.post("/api/auth/provision-founder")
    @limiter.limit("10 per 15 minutes")
    def provision_founder():
        if User.query.filter_by(role_code="FOUNDER_SUPER_ADMIN").count() > 0:
            return jsonify({"error": "Founder already provisioned."}), 409
        data = request.get_json(force=True)
        password = data.get("password", "")
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters."}), 400
        founder = User(
            institution_id=None,
            username=data["username"].strip().lower(),
            email=data["email"].strip().lower(),
            full_name=data["fullName"].strip(),
            password_hash=ph.hash(password),
            role_code="FOUNDER_SUPER_ADMIN",
            status="active",
        )
        db.session.add(founder)
        db.session.commit()
        session["user_id"] = founder.id
        session["csrf_token"] = secrets.token_hex(24)
        session.permanent = True
        return jsonify({"id": founder.id, "csrfToken": session["csrf_token"], "message": "Founder provisioned."}), 201

    @app.post("/api/auth/login")
    @limiter.limit("25 per 10 minutes")
    def login():
        data = request.get_json(force=True)
        ident = data.get("identifier", "").strip().lower()
        password = data.get("password", "")
        user = User.query.filter((User.email == ident) | (User.username == ident)).first()
        if not user:
            db.session.add(LoginHistory(identifier=ident, outcome="failed", ip_address=request.remote_addr or "", reason="Unknown user"))
            db.session.commit()
            return jsonify({"error": "Invalid credentials."}), 401
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            return jsonify({"error": "Account temporarily locked."}), 423
        try:
            ph.verify(user.password_hash, password)
        except VerifyMismatchError:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.session.add(LoginHistory(user_id=user.id, institution_id=user.institution_id, identifier=ident, outcome="failed", ip_address=request.remote_addr or ""))
            db.session.commit()
            return jsonify({"error": "Invalid credentials."}), 401
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(timezone.utc)
        db.session.add(LoginHistory(user_id=user.id, institution_id=user.institution_id, identifier=ident, outcome="success", ip_address=request.remote_addr or ""))
        db.session.commit()
        session["user_id"] = user.id
        session["csrf_token"] = secrets.token_hex(24)
        session.permanent = bool(data.get("rememberMe", False))
        return jsonify({"id": user.id, "email": user.email, "roleCode": user.role_code, "csrfToken": session["csrf_token"]})

    @app.get("/api/institutions/founder-dashboard")
    @require_founder
    def founder_dashboard():
        return jsonify({
            "kpis": {
                "totalInstitutions": Institution.query.count(),
                "activeInstitutions": Institution.query.filter_by(status="active").count(),
                "suspendedInstitutions": Institution.query.filter_by(status="suspended").count(),
                "totalStudents": Student.query.count(),
                "totalTeachers": Teacher.query.count(),
                "totalAdministrators": User.query.filter(User.role_code.in_(["FOUNDER_SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL"])).count(),
            }
        })

    @app.post("/api/institutions")
    @require_founder
    def create_institution():
        d = request.get_json(force=True)
        code = f"AVN-INST-{1001 + Institution.query.count()}"
        inst = Institution(
            institution_code=code,
            name=d["name"].strip(),
            short_name=d.get("shortName", "INST")[:12],
            email=d["email"].strip().lower(),
            city=d.get("city", ""),
            subscription_plan=d.get("subscriptionPlan", "Enterprise"),
            annual_license_fee=float(d.get("annualLicenseFee", 18000)),
        )
        db.session.add(inst)
        db.session.flush()
        admin = User(
            institution_id=inst.id,
            username=d["adminUsername"].strip().lower(),
            email=d["adminEmail"].strip().lower(),
            full_name=d["adminFullName"].strip(),
            password_hash=ph.hash(d["adminPassword"]),
            role_code="INSTITUTION_ADMIN",
        )
        db.session.add(admin)
        db.session.commit()
        record_audit("INSTITUTION_CREATED", f"Created {inst.name} ({code})", inst.id)
        return jsonify({"id": inst.id, "institutionCode": code}), 201

    @app.route("/api/students", methods=["GET", "POST"])
    @require_tenant
    def students_collection():
        if request.method == "GET":
            rows = Student.query.filter_by(institution_id=g.tenant_id).order_by(Student.id.desc()).all()
            return jsonify({"students": [{"id": s.id, "student_code": s.student_code, "full_name": s.full_name, "email": s.email, "status": s.status} for s in rows]})
        d = request.get_json(force=True)
        count = Student.query.filter_by(institution_id=g.tenant_id).count()
        s = Student(
            institution_id=g.tenant_id,
            student_code=f"STU-{g.tenant_id}-{101 + count}",
            admission_number=f"ADM-2026-{g.tenant_id}{1000 + count}",
            full_name=d["fullName"].strip(),
            email=d["email"].strip().lower(),
            guardian_name=d.get("guardianName", ""),
        )
        db.session.add(s)
        db.session.commit()
        record_audit("STUDENT_CREATED", f"Enrolled {s.full_name}")
        return jsonify({"id": s.id, "student_code": s.student_code}), 201

    @app.post("/api/backups/create")
    @require_founder
    def create_backup():
        uri = app.config["SQLALCHEMY_DATABASE_URI"]
        os.makedirs(app.config["BACKUP_DIR"], exist_ok=True)
        if uri.startswith("sqlite:///"):
            src = uri.replace("sqlite:///", "")
            fname = f"aaknova-flask-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.db"
            dst = os.path.join(app.config["BACKUP_DIR"], fname)
            shutil.copy2(src, dst)
            with open(dst, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            return jsonify({"filename": fname, "sha256": digest}), 201
        return jsonify({"message": "Use pg_dump for PostgreSQL production backups as documented in docs/DEPLOYMENT_AND_ANDROID.md"}), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("FLASK_PORT", "5000")))
