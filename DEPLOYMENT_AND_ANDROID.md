# AAKNOVA — Installation, Deployment & Android APK Signing Guide

## 1. First-Run Founder Provisioning & Test Accounts

AAKNOVA **never ships with hardcoded master passwords**.

1. Start the application and open `http://localhost:3000` (or your HTTPS production URL).
2. On first launch, AAKNOVA detects that no Founder Super Admin exists and opens the **First-Run Founder Provisioning** screen.
3. Enter your Founder name, email, and a strong password (minimum 10 characters, uppercase, lowercase, digit, and special character).
4. Optional: Keep **"Seed two isolated demonstration institutions"** checked if you want ready-to-test multi-tenant sample data.
   - Upon completion, AAKNOVA provisions two isolated institutions (`AVN-INST-1001` Meridian International Academy and `AVN-INST-1002` Apex Institute of Technology) with **cryptographically random one-time Institution Admin passwords** displayed once on screen for testing tenant isolation.
   - Save those one-time credentials immediately, or create new institutions and administrators anytime from the Founder Dashboard.

---

## 2. Local Development (Live Express + SQLite WAL Runtime)

```bash
npm install
cp .env.example .env
npm run dev
```

- Web UI & API run on `http://localhost:3000`.
- Persistent SQLite database is stored at `./data/aaknova.db` (WAL mode, foreign keys enforced).
- Backups are saved with SHA-256 checksums under `./data/backups/`.
- Download the full source code archive anytime from **Backups & ZIP → Download Complete Project ZIP** (served from `GET /api/backups/project-zip`).

---

## 3. Production Deployment (Python Flask + PostgreSQL + SQLAlchemy)

The `/flask_backend` directory contains the production Python Flask + SQLAlchemy + Argon2 + PostgreSQL backend with Alembic-ready relational schemas and Docker Compose orchestration.

### Option A: Docker Compose (Recommended)

```bash
cd flask_backend
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export SECRET_KEY="$(openssl rand -hex 32)"
docker compose up -d --build
```

### Option B: Bare-Metal / Linux Server with Gunicorn + Nginx HTTPS

```bash
cd flask_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="postgresql+psycopg://aaknova_user:STRONG_PASSWORD@127.0.0.1:5432/aaknova"
export SECRET_KEY="$(openssl rand -hex 32)"
export COOKIE_SECURE="true"

gunicorn --workers 4 --bind 127.0.0.1:5000 --access-logfile - app:app
```

Configure Nginx with TLS 1.3 (Let's Encrypt / Certbot) to serve the compiled frontend (`/dist`) and reverse-proxy `/api/*` to `http://127.0.0.1:5000` with `X-Forwarded-Proto https`.

### SQLite Development Mode for Flask

If `DATABASE_URL` is omitted, `flask_backend/config.py` automatically falls back to `sqlite:///aaknova_flask.db`.

---

## 4. Progressive Web App (PWA) Installation

AAKNOVA is configured with `vite-plugin-pwa` (Web App Manifest, maskable AVN launcher icons, offline navigation shell, and service worker):

- **Android Chrome / Edge**: Tap the **Install App** button in the top header (or browser menu → *Add to Home screen / Install app*).
- **iOS Safari**: Tap **Share → Add to Home Screen**.
- **Desktop Chrome / Edge**: Click the install icon in the address bar or the **Install App** button in the AAKNOVA header.

---

## 5. Android Application (Capacitor) & Signed APK Build

The `/capacitor.config.ts` and `/android` directory contain the complete Capacitor Android project (`com.aaknova.enterprise`) with:
- Adaptive & legacy AVN launcher icons (`res/mipmap-*`)
- Native deep-navy Splash Screen (`res/drawable/splash.xml`, Android 12+ `Theme.SplashScreen`)
- Strict HTTPS network security policy (`res/xml/network_security_config.xml`)
- Externalized release signing via `android/keystore.properties` or CI environment variables

### Prerequisites (Local Machine or CI Runner)
- Node.js 20+
- JDK 17 (Temurin / OpenJDK)
- Android Studio / Android SDK Platform 34 & Build Tools 34.0.0+

### Step 1: Generate a Production Release Keystore (Once)

```bash
keytool -genkeypair -v \
  -keystore android/app/aaknova-release.jks \
  -alias aaknova-release \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Store `aaknova-release.jks` securely offline (never commit it to git).

### Step 2: Configure Release Signing

```bash
cp android/keystore.properties.example android/keystore.properties
```

Edit `android/keystore.properties` with your keystore path, alias, and passwords.

### Step 3: Build Web Assets & Sync Capacitor

```bash
npm install
npm install --no-save @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap sync android
```

### Step 4: Compile & Sign Release APK

```bash
cd android
./gradlew assembleRelease
```

The signed release APK is output at:
`android/app/build/outputs/apk/release/app-release.apk`

Verify the V1/V2/V3 APK signature:
```bash
apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
```

### Automated Cloud Build (GitHub Actions)

Push a release tag (`git tag v1.0.0 && git push --tags`) with repository secrets `AAKNOVA_KEYSTORE_BASE64`, `AAKNOVA_KEYSTORE_PASSWORD`, `AAKNOVA_KEY_ALIAS`, and `AAKNOVA_KEY_PASSWORD` to trigger `.github/workflows/android-apk.yml` and download the verified signed APK artifact directly from GitHub Actions.

### Updating the Android Application

1. Increment `versionCode` (integer) and `versionName` (e.g. `"1.1.0"`) in `android/app/build.gradle`.
2. Run `npm run build && npx cap sync android`.
3. Rebuild with `./gradlew assembleRelease` using the **exact same keystore** so Android devices accept the update seamlessly.
