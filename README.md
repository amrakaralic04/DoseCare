# DoseCare - Pametna kutija za lijekove (Frontend + Firebase)

Production-ready vanilla JS frontend sa Firebase Auth + Firestore + Hosting, uz Cloud Functions API sloj za ESP32.

## Struktura projekta
```
/
  public/
    index.html
    env.js
  src/
    css/
      tokens.css
      base.css
      components.css
    js/
      firebase.js
      auth.js
      router.js
      api.js
      ui.js
      pages/
        login.js
        register.js
        dashboard.js
        history.js
        settings.js
      main.js
  functions/
    package.json
    src/index.js
  firestore.rules
  firebase.json
  .env.example
  README.md
  seed.js
```

## Firebase setup (Console)
1. Kreiraj novi Firebase project.
2. **Authentication** → Enable Email/Password.
3. **Firestore Database** → Create database (production mode). Region: `europe-west1`.
4. **Hosting** → Get started.
5. **Functions** → Enable billing (Blaze) za Cloud Functions.

## Lokalni setup
1. Instaliraj dependencies:
```bash
npm install
cd functions
npm install
```
2. Konfiguriši `public/env.js`:
    - Kopiraj vrijednosti iz Firebase Console → Project settings → General → Your apps.
    - Primjer je u `.env.example`.

## Dev server
```bash
npm run dev
```
Otvara `http://localhost:5173`.

## Firebase init
```bash
npm install -g firebase-tools
firebase login
firebase init
```
Odaberi:
- Firestore → postojeći project
- Functions → JavaScript (Node 18)
- Hosting → `public`

## Deploy
```bash
firebase deploy --only functions,hosting,firestore
```

## ESP32 API (Cloud Functions)
- `POST /api/device/ping`
- `POST /api/device/event`
- `GET /api/device/config`
- `POST /api/device/pair`

## Seed demo device
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node seed.js DEVICE_ID SECRET
```

## Troubleshooting
- **401 Unauthorized**: provjeri secret i vrijeme na uređaju (timestamp). Functions odbijaju stare pozive.
- **Firestore permission denied**: provjeri `firestore.rules` i da je uređaj povezan sa korisnikom.
- **CORS greške**: deploy Functions i koristi `FUNCTIONS_BASE_URL` iz `.env.example`.
- **Auth error**: provjeri Email/Password provider u Firebase Auth.