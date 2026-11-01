# Complete cPanel Deployment Guide — Greenwood Public School

**Target Domain:** [https://stthomaspublicschoolPune.org/](https://stthomaspublicschoolPune.org/)  
**Project Stack:** Static HTML5/CSS3/JS (Frontend) + Node.js & Express.js (Backend) + Firebase Firestore & Auth (Database)

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Step 1: Log in to cPanel](#step-1-log-in-to-cpanel)
4. [Step 2: Prepare Code Files for Production](#step-2-prepare-code-files-for-production)
5. [Step 3: Deploy the Node.js Backend API](#step-3-deploy-the-nodejs-backend-api)
6. [Step 4: Deploy the Frontend Static Files](#step-4-deploy-the-frontend-static-files)
7. [Step 5: Enable Free SSL Certificate (HTTPS)](#step-5-enable-free-ssl-certificate-https)
8. [Step 6: Verify and Test the Live Website](#step-6-verify-and-test-the-live-website)
9. [Step 7: Common cPanel Issues & Troubleshooting](#step-7-common-cpanel-issues--troubleshooting)
10. [Step 8: Final Client Handover Instructions](#step-8-final-client-handover-instructions)

---

## 1. Architecture Overview

Before starting, here is how your website will run on cPanel:

```
User visits: https://stthomaspublicschoolPune.org
               │
               ├── Static Frontend (HTML, CSS, JS, Images)
               │   Location: /public_html/
               │
               └── Backend REST API (Node.js + Express)
                   Location: /home/username/backend_app (outside public_html)
                   App Route: /api
                   Database: Firebase Firestore (Cloud)
```

- **Frontend:** HTML, CSS, JS, and image assets sit inside cPanel's `public_html/` folder.
- **Backend:** Node.js app runs as a background service managed by cPanel's **Setup Node.js App** feature and routes traffic through `/api`.
- **Database:** Firebase Firestore runs in the cloud (no MySQL database configuration required).

---

## 2. Prerequisites Checklist

Make sure you have:
- [x] cPanel login credentials (URL, Username, Password) from your web hosting provider (e.g. Hostinger, Bluehost, Namecheap, GoDaddy).
- [x] Domain `stthomaspublicschoolPune.org` pointed to your hosting server's Nameservers (DNS).
- [x] Firebase project credentials (Project ID, Client Email, Private Key).

---

## Step 1: Log in to cPanel

1. Open your web browser and navigate to your cPanel login URL:
   - Example: `https://stthomaspublicschoolPune.org:2083` or `https://your-hosting-ip:2083`
2. Enter your **cPanel Username** and **Password**.
3. Click **Log In**. You will land on the cPanel Dashboard.

---

## Step 2: Prepare Code Files for Production

Before uploading files to cPanel, make two quick updates in your local project folder:

### A. Update `js/api.js` (Frontend API URL)
In `js/api.js`, make sure the production fallback points to your live API endpoint:
```javascript
// Local dev auto-detects localhost:5000; Production uses /api
const API_BASE = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (protocol === 'file:') {
        return 'http://localhost:5000/api';
    }

    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
    ) {
        return `${protocol}//${hostname}:5000/api`;
    }

    // Production Domain
    return '/api';
})();
```

### B. Update `backend/.env` (Backend Production Settings)
Prepare your production `.env` settings:
```env
PORT=5000
NODE_ENV=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=st-thomas-school-b71e3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@st-thomas-school-b71e3.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=st-thomas-school-b71e3.firebasestorage.app

# CORS Allowed Origins
ALLOWED_ORIGINS=https://stthomaspublicschoolPune.org,https://www.stthomaspublicschoolPune.org

# Production Domain
PRODUCTION_DOMAIN=stthomaspublicschoolPune.org

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
FORM_RATE_LIMIT_MAX=30
```

---

## Step 3: Deploy the Node.js Backend API

### Step 3.1: Create a Zip File of the Backend Folder
1. On your computer, open your project directory and locate the `backend` folder.
2. Select all files inside `backend` **EXCEPT** `node_modules` (do NOT zip `node_modules`).
3. Right-click and choose **Compress to ZIP** (name it `backend.zip`).

### Step 3.2: Upload `backend.zip` to cPanel
1. In cPanel, click on **File Manager** under the *Files* section.
2. You will be in the home directory (`/home/username`).
3. Click **New Folder** at the top left, name it `backend_app`, and click **Create New Folder**.
4. Double-click to open the `backend_app` folder.
5. Click **Upload** in the top toolbar.
6. Drag and drop `backend.zip` into the upload zone.
7. Once the progress bar turns **green (100%)**, return to File Manager.
8. Right-click `backend.zip` and select **Extract** -> **Extract Files**.
9. Delete `backend.zip` to save disk space.

### Step 3.3: Set Up Node.js App in cPanel
1. Go back to the main cPanel Dashboard.
2. Under the *Software* section, click **Setup Node.js App**.
3. Click **Create Application**.
4. Fill in the application details:
   - **Node.js Version:** Select **18.x** or **20.x** (latest available).
   - **Application Mode:** Select **Production**.
   - **Application Root:** Enter `backend_app` (the folder created in Step 3.2).
   - **Application URL:** Enter `api` (this maps requests from `stthomaspublicschoolPune.org/api` to Node.js).
   - **Application Startup File:** Enter `server.js`.
5. Scroll down to **Environment Variables** and add your `.env` variables:
   - `NODE_ENV` = `production`
   - `FIREBASE_PROJECT_ID` = `st-thomas-school-b71e3`
   - `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-fbsvc@st-thomas-school-b71e3.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY` = *(paste your full private key string)*
   - `ALLOWED_ORIGINS` = `https://stthomaspublicschoolPune.org,https://www.stthomaspublicschoolPune.org`
6. Click **Save** (top right).

### Step 3.4: Install NPM Dependencies
1. After saving, cPanel will display a command near the top of the page:
   - Example: `source /home/username/nodevenv/backend_app/18/bin/activate && cd /home/username/backend_app`
2. Click the **Run NPM Install** button on the Node.js App page in cPanel.
   - *Alternative:* Open **Terminal** in cPanel, paste the copied command, press Enter, then run `npm install`.
3. Once installation completes, click **Restart Application**.

---

## Step 4: Deploy the Frontend Static Files

### Step 4.1: Zip the Frontend Files
1. On your computer, open your project folder (where `index.html`, `css/`, `js/`, `assets/` reside).
2. Select all files and folders **EXCEPT** the `backend` folder.
3. Right-click and choose **Compress to ZIP** (name it `frontend.zip`).

### Step 4.2: Upload to `public_html`
1. Open cPanel **File Manager**.
2. Open the `public_html` directory (this is the root directory for your domain).
3. If there are default files like `index.php` or `default.html`, select and delete them.
4. Click **Upload** in the top toolbar and upload `frontend.zip`.
5. Right-click `frontend.zip` and select **Extract** -> **Extract Files** into `public_html`.
6. Delete `frontend.zip`.

### Step 4.3: Configure `.htaccess` Routing
1. Inside `public_html`, check if a file named `.htaccess` exists.
   - *If not visible:* Click **Settings** (top right of File Manager) -> check **Show Hidden Files (dotfiles)** -> click **Save**.
2. Create or edit `.htaccess` inside `public_html` and paste the following configuration:

```apache
# Enable Rewrite Engine
RewriteEngine On

# 1. Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 2. Proxy /api requests to Node.js backend
RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]

# 3. Serve Static HTML files cleanly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]
```

---

## Step 5: Enable Free SSL Certificate (HTTPS)

1. Return to the cPanel Dashboard.
2. Under the *Security* section, click **SSL/TLS Status** (or **Let's Encrypt SSL** / **AutoSSL**).
3. Check the checkbox next to `stthomaspublicschoolPune.org` and `www.stthomaspublicschoolPune.org`.
4. Click **Run AutoSSL**.
5. Wait 1–2 minutes. cPanel will automatically issue and install a free SSL certificate. A green padlock icon will appear next to your domain.

---

## Step 6: Verify and Test the Live Website

Open your browser and test each section of your website:

### 1. Test Home Page & SSL:
Visit [https://stthomaspublicschoolPune.org](https://stthomaspublicschoolPune.org)  
- Verify the green padlock icon appears in the browser address bar.

### 2. Test Backend Health Check:
Visit [https://stthomaspublicschoolPune.org/api/health](https://stthomaspublicschoolPune.org/api/health)  
- Expected response:
  ```json
  {
    "success": true,
    "message": "All systems operational",
    "data": { "status": "healthy", ... }
  }
  ```

### 3. Test Admin Login:
- Click **Admin Login** in the top bar.
- Enter credentials:
  - **Email:** `admin@stthomasschool.com`
  - **Password:** `StThomas@Admin2026`
- Verify successful login toast notification and redirection to the **Admin Dashboard** (`admin.html`).

### 4. Test Public Form Submissions:
- Go to `admission.html`, submit an enquiry form, and confirm the success notification appears.

---

## Step 7: Common cPanel Issues & Troubleshooting

### Issue 1: `502 Bad Gateway` or `503 Service Unavailable`
- **Cause:** The Node.js application failed to start or `server.js` crashed.
- **Fix:**
  1. Open cPanel **Setup Node.js App**.
  2. Click **Restart**.
  3. Check the log file path shown on the Node.js setup page (e.g. `stderr.log`) in File Manager to see the exact crash error.

### Issue 2: Firebase Private Key Error (`Invalid PEM formatted key`)
- **Cause:** Newlines (`\n`) in `FIREBASE_PRIVATE_KEY` were escaped incorrectly when entered into cPanel environment variables.
- **Fix:**
  In cPanel Node.js App environment variables, ensure `FIREBASE_PRIVATE_KEY` wraps the key in quotes and preserves `\n`, or format the key using double backslashes `\\n`. Alternatively, place a `.env` file directly inside `/home/username/backend_app/` containing:
  `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

### Issue 3: CORS Blocking Requests (`Access-Control-Allow-Origin`)
- **Cause:** The backend's `ALLOWED_ORIGINS` environment variable does not include the exact live domain.
- **Fix:** Update `ALLOWED_ORIGINS` in cPanel Node.js App environment variables to:
  `https://stthomaspublicschoolPune.org,https://www.stthomaspublicschoolPune.org`
  Then click **Restart Application**.

### Issue 4: Mixed Content Warning (HTTP assets blocked on HTTPS site)
- **Cause:** Images or scripts are loaded using `http://` instead of `https://` or relative paths.
- **Fix:** Ensure all external scripts (Google Fonts, FontAwesome, Firebase CDN) use `https://` protocol.

---

## Step 8: Final Client Handover Instructions

Once deployment and verification are complete, hand over the following credentials to your client:

1. **Website Address:** [https://stthomaspublicschoolPune.org](https://stthomaspublicschoolPune.org)
2. **Admin Portal Login:**
   - **Login Button:** Click "Admin Login" in the top bar or visit `https://stthomaspublicschoolPune.org/admin.html`
   - **Email:** `admin@stthomasschool.com`
   - **Password:** `StThomas@Admin2026` *(Advise client to update password upon first login)*
3. **cPanel Access Credentials:** (Username, Password, Login URL)
4. **Firebase Console Access:** Transfer Firebase project ownership to client's Google Account.
