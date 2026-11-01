# Greenwood Public School — Backend Implementation Plan

## 📋 Project Overview

A complete **industry-level backend** for the Greenwood Public School website using **Node.js + Express.js** with **Firebase Firestore** as the database. This backend will power all dynamic content, handle form submissions, manage admin authentication, and provide a clean REST API.

**Frontend:** 14-page static HTML/CSS/JS school website (already built)  
**Backend:** Node.js + Express.js REST API  
**Database:** Firebase Firestore  
**Auth:** Firebase Authentication  
**Storage:** Firebase Storage (images, PDFs)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────┐
│     Frontend (Static Site)       │
│  HTML Pages → admission.js /    │
│              main.js             │
└──────────────┬───────────────────┘
               │ REST API calls
               ▼
┌──────────────────────────────────┐
│   Backend (Node.js + Express)    │
│                                  │
│  ┌───────────┐  ┌─────────────┐  │
│  │ Auth      │  │ Rate        │  │
│  │ Middleware │  │ Limiter     │  │
│  └─────┬─────┘  └──────┬──────┘  │
│        ▼               ▼         │
│  ┌─────────────────────────────┐ │
│  │     Route Handlers          │ │
│  └─────────────┬───────────────┘ │
│                ▼                 │
│  ┌─────────────────────────────┐ │
│  │     Service Layer           │ │
│  └─────────────┬───────────────┘ │
│                ▼                 │
│  ┌─────────────────────────────┐ │
│  │   Firebase Admin SDK        │ │
│  └─────────────────────────────┘ │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│           Firebase               │
│                                  │
│  Firestore │ Auth │ Storage      │
└──────────────────────────────────┘
```

---

## 📁 Project Structure

```
st-thomas-2/
├── backend/                          ← NEW: entire backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.js           # Firebase Admin SDK init
│   │   │   ├── env.js                # Environment config loader
│   │   │   └── cors.js               # CORS whitelist config
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.js               # JWT/Firebase token verification
│   │   │   ├── rateLimiter.js        # Rate limiting (per-route)
│   │   │   ├── validator.js          # express-validator wrappers
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── requestLogger.js      # Morgan/Winston logging
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js              # Route aggregator
│   │   │   ├── auth.routes.js        # POST /api/auth/login, /verify
│   │   │   ├── admission.routes.js   # POST /api/admissions
│   │   │   ├── contact.routes.js     # POST /api/contact
│   │   │   ├── alumni.routes.js      # POST /api/alumni, GET /api/alumni/stories
│   │   │   ├── news.routes.js        # CRUD /api/news, /api/announcements
│   │   │   ├── gallery.routes.js     # CRUD /api/gallery
│   │   │   ├── faculty.routes.js     # CRUD /api/faculty, /api/staff
│   │   │   ├── achievements.routes.js # CRUD /api/achievements
│   │   │   ├── academics.routes.js   # CRUD /api/academics
│   │   │   ├── events.routes.js      # CRUD /api/events
│   │   │   └── parents.routes.js     # CRUD /api/parents
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admission.controller.js
│   │   │   ├── contact.controller.js
│   │   │   ├── alumni.controller.js
│   │   │   ├── news.controller.js
│   │   │   ├── gallery.controller.js
│   │   │   ├── faculty.controller.js
│   │   │   ├── achievements.controller.js
│   │   │   ├── academics.controller.js
│   │   │   ├── events.controller.js
│   │   │   └── parents.controller.js
│   │   │
│   │   ├── services/
│   │   │   ├── firestore.service.js  # Generic Firestore CRUD abstraction
│   │   │   ├── auth.service.js       # Firebase Auth operations
│   │   │   ├── storage.service.js    # Firebase Storage (image uploads)
│   │   │   └── email.service.js      # Email notifications (optional)
│   │   │
│   │   ├── validators/
│   │   │   ├── admission.validator.js
│   │   │   ├── contact.validator.js
│   │   │   ├── alumni.validator.js
│   │   │   ├── news.validator.js
│   │   │   ├── gallery.validator.js
│   │   │   └── common.validator.js   # Shared validation rules
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiResponse.js        # Standardized response format
│   │   │   ├── ApiError.js           # Custom error classes
│   │   │   ├── asyncHandler.js       # Async/await error wrapper
│   │   │   ├── logger.js             # Winston logger setup
│   │   │   └── constants.js          # App-wide constants
│   │   │
│   │   └── app.js                    # Express app setup
│   │
│   ├── .env.example                  # Template for env variables
│   ├── .gitignore
│   ├── server.js                     # Entry point (starts server)
│   ├── package.json
│   └── serviceAccountKey.json        # Firebase Admin credentials (gitignored)
│
├── css/                              # Existing frontend
├── js/                               # Existing frontend
├── assets/                           # Existing frontend
├── index.html                        # Existing frontend
└── ...                               # Other HTML pages
```

---

## 🚀 Phased Implementation

---

### ✅ Phase 1: Project Setup & Infrastructure

> **Goal:** Running Express server with Firebase connected, full middleware stack, and utility classes.

#### What Gets Built:
- Express server with health check endpoint
- Firebase Admin SDK initialization & connection verification
- Security middleware (Helmet, CORS)
- Request logging (Morgan + Winston)
- Standardized API response & error classes
- Async handler wrapper for clean error propagation
- Generic Firestore CRUD service (reusable across all collections)
- Environment config loader with validation

#### Key Design Decisions:

**Standardized API Responses:**
```json
// Success
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 45 }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

**Generic Firestore Service Methods:**
```
create(data)           → Add document with auto-generated ID
getById(id)            → Get single document
getAll(options)        → Paginated list with sorting & filtering
update(id, data)       → Partial update
delete(id)             → Soft or hard delete
query(filters)         → Advanced compound queries
```

#### Deliverable:
`GET /api/health` → returns `{ status: "ok", timestamp: "...", firebase: "connected" }`

---

### ✅ Phase 2: Authentication & Admin System

> **Goal:** Admin login via Firebase Auth with token-based route protection.

#### API Endpoints:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/auth/login` | ❌ | Verify credentials, return token |
| `GET` | `/api/auth/verify` | ✅ | Verify token validity |
| `GET` | `/api/auth/me` | ✅ | Get current admin profile |

#### Middleware Stack:
- `verifyToken` — Validates Firebase ID token from `Authorization: Bearer <token>` header
- `requireAdmin` — Checks custom claims for admin role
- Attaches decoded user info to `req.user`

#### Deliverable:
Admin can login with email/password → receives token → token grants access to protected CRUD routes. Unauthorized requests are rejected with 401.

---

### ✅ Phase 3: Form Submission APIs (Public)

> **Goal:** All 3 website forms (admission, contact, alumni) submit to the backend with validation & rate limiting.

#### Rate Limiting:
- Form submissions: **5 per IP per 15 minutes**
- General API: **100 requests per IP per 15 minutes**

#### Admission Enquiry API:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/admissions` | ❌ (rate-limited) | Submit new enquiry |
| `GET` | `/api/admissions` | ✅ Admin | List all enquiries (paginated) |
| `GET` | `/api/admissions/:id` | ✅ Admin | Get single enquiry |
| `PATCH` | `/api/admissions/:id` | ✅ Admin | Update status (new/read/replied) |
| `DELETE` | `/api/admissions/:id` | ✅ Admin | Delete enquiry |

**Validation:** studentName (required, 2-100 chars), parentName (required), email (valid format), phone (10-digit Indian), dob (valid date), classApplied (from allowed list), message (max 1000 chars)

#### Contact Inquiries API:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/contact` | ❌ (rate-limited) | Submit contact message |
| `GET` | `/api/contact` | ✅ Admin | List all messages (paginated) |
| `PATCH` | `/api/contact/:id` | ✅ Admin | Mark as read/replied |
| `DELETE` | `/api/contact/:id` | ✅ Admin | Delete message |

**Validation:** name (required), email (valid format), phone (optional, 10-digit), subject (required, max 200), message (required, max 2000)

#### Alumni Registration API:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/alumni` | ❌ (rate-limited) | Register as alumni |
| `GET` | `/api/alumni` | ✅ Admin | List all registrations (paginated) |
| `DELETE` | `/api/alumni/:id` | ✅ Admin | Delete registration |

**Validation:** name (required), email (valid format), phone (optional), yearOfPassing (required, 4-digit year), occupation (optional), message (max 2000)

#### Deliverable:
All 3 forms submit to backend API → data stored in Firestore → admin can view/manage submissions. Rate limiting prevents abuse.

---

### ✅ Phase 4: Content Management APIs (Admin CRUD)

> **Goal:** Full CRUD for all 20+ dynamic content sections. Public GET for frontend, admin-only POST/PUT/DELETE.

#### News & Announcements:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/news` | ❌ | Get announcements (public) |
| `POST` | `/api/news` | ✅ | Create announcement |
| `PUT` | `/api/news/:id` | ✅ | Update announcement |
| `DELETE` | `/api/news/:id` | ✅ | Delete announcement |
| `GET` | `/api/news/circulars` | ❌ | Get circulars list (public) |
| `POST` | `/api/news/circulars` | ✅ | Upload circular (PDF) |
| `DELETE` | `/api/news/circulars/:id` | ✅ | Remove circular |
| `GET` | `/api/news/holidays` | ❌ | Get holiday notices (public) |
| `POST` | `/api/news/holidays` | ✅ | Add holiday notice |
| `DELETE` | `/api/news/holidays/:id` | ✅ | Remove holiday |

#### Gallery:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/gallery` | ❌ | Get photos (filterable by category) |
| `POST` | `/api/gallery` | ✅ | Upload photo with category & caption |
| `PUT` | `/api/gallery/:id` | ✅ | Update photo metadata |
| `DELETE` | `/api/gallery/:id` | ✅ | Delete photo (+ from Storage) |

#### Faculty & Staff:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/faculty` | ❌ | Get faculty list (public) |
| `POST` | `/api/faculty` | ✅ | Add faculty member |
| `PUT` | `/api/faculty/:id` | ✅ | Update faculty info |
| `DELETE` | `/api/faculty/:id` | ✅ | Remove faculty member |
| `GET` | `/api/staff` | ❌ | Get staff list (public) |
| `POST` | `/api/staff` | ✅ | Add staff member |
| `PUT` | `/api/staff/:id` | ✅ | Update staff info |
| `DELETE` | `/api/staff/:id` | ✅ | Remove staff member |

#### Achievements:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/achievements` | ❌ | Get achievements (public) |
| `POST` | `/api/achievements` | ✅ | Add achievement |
| `PUT` | `/api/achievements/:id` | ✅ | Update achievement |
| `DELETE` | `/api/achievements/:id` | ✅ | Delete achievement |
| `GET` | `/api/awards` | ❌ | Get awards list (public) |
| `POST` | `/api/awards` | ✅ | Add award |
| `DELETE` | `/api/awards/:id` | ✅ | Remove award |

#### Academics:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/academics/curriculum` | ❌ | Get curriculum info |
| `PUT` | `/api/academics/curriculum` | ✅ | Update curriculum content |
| `GET` | `/api/academics/calendar` | ❌ | Get academic calendar |
| `PUT` | `/api/academics/calendar` | ✅ | Update calendar |
| `GET` | `/api/academics/exams` | ❌ | Get exam information |
| `PUT` | `/api/academics/exams` | ✅ | Update exam info |

#### Events:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/events` | ❌ | Get upcoming events (public) |
| `POST` | `/api/events` | ✅ | Create event |
| `PUT` | `/api/events/:id` | ✅ | Update event |
| `DELETE` | `/api/events/:id` | ✅ | Delete event |

#### Student Life:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/student-life/:category` | ❌ | Get by category (sports/cultural/competitions/trips) |
| `POST` | `/api/student-life` | ✅ | Add content with category |
| `PUT` | `/api/student-life/:id` | ✅ | Update content |
| `DELETE` | `/api/student-life/:id` | ✅ | Delete content |

#### Parents Section:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/parents/downloads` | ❌ | Get downloadable files |
| `POST` | `/api/parents/downloads` | ✅ | Upload file |
| `DELETE` | `/api/parents/downloads/:id` | ✅ | Remove file |
| `GET` | `/api/parents/circulars` | ❌ | Get parent circulars |
| `POST` | `/api/parents/circulars` | ✅ | Add circular |
| `GET` | `/api/parents/pta` | ❌ | Get PTA information |
| `PUT` | `/api/parents/pta` | ✅ | Update PTA info |

#### Alumni Content:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/alumni/stories` | ❌ | Get success stories (public) |
| `POST` | `/api/alumni/stories` | ✅ | Add success story |
| `DELETE` | `/api/alumni/stories/:id` | ✅ | Remove story |
| `GET` | `/api/alumni/events` | ❌ | Get alumni events (public) |
| `POST` | `/api/alumni/events` | ✅ | Add alumni event |
| `DELETE` | `/api/alumni/events/:id` | ✅ | Remove event |

#### Ticker/Announcements:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/ticker` | ❌ | Get active ticker items |
| `POST` | `/api/ticker` | ✅ | Add ticker item |
| `PUT` | `/api/ticker/:id` | ✅ | Update ticker item |
| `DELETE` | `/api/ticker/:id` | ✅ | Remove ticker item |

#### Firebase Storage Service:
- Upload images (gallery, faculty photos) to Firebase Storage
- Upload PDFs (circulars, downloads) to Firebase Storage
- Auto-generate download URLs
- Delete files when content is removed

#### Deliverable:
Complete REST API for managing all 20+ content collections. Admin can create, read, update, and delete content for every dynamic section on the website.

---

### ✅ Phase 5: Frontend Integration

> **Goal:** Wire the existing HTML/JS frontend to call the backend APIs.

#### Changes:

**`js/admission.js` (Modify):**
- Replace all `localStorage` calls with `fetch()` calls to backend endpoints
- Add loading spinner on form submit
- Add proper error handling and user feedback
- Wire admission form → `POST /api/admissions`
- Wire contact form → `POST /api/contact`
- Wire alumni form → `POST /api/alumni`

**Dynamic Content Loading (New JS):**
- Create `js/api.js` — centralized API client with base URL config
- On page load, fetch data from relevant endpoints and populate HTML
- `index.html` — fetch news/notices, ticker announcements
- `news.html` — fetch announcements, circulars, holidays, events
- `gallery.html` — fetch gallery items dynamically
- `faculty.html` — fetch faculty & staff profiles
- `achievements.html` — fetch achievements & awards
- `academics.html` — fetch curriculum, calendar, exam info
- `student-life.html` — fetch sports, cultural, competitions, trips
- `parents.html` — fetch downloads, circulars, PTA info
- `alumni.html` — fetch success stories & events

**Admin Panel (New Pages):**
- `admin/login.html` — Admin login page
- `admin/dashboard.html` — Main dashboard with sidebar navigation
- `admin/manage-[section].html` — CRUD interfaces for each content type

**Announcement Ticker (Modify `index.html`):**
- Fetch ticker items from `GET /api/ticker` on page load
- Dynamically build ticker content

**Admin Login Button (Modify all pages):**
- Wire "Admin Login" button to redirect to `admin/login.html`

#### Deliverable:
The entire website is fully dynamic. Forms submit to the backend, content loads from Firestore, admin can login and manage everything through the admin panel.

---

### ✅ Phase 6: Production Hardening & Advanced Features

> **Goal:** Security, performance, and deployment readiness.

#### Security:
- Input sanitization with `xss` or `sanitize-html` library
- SQL injection prevention (N/A with Firestore, but sanitize inputs)
- File upload validation (type, size limits)
- Security headers via `helmet`

#### Performance:
- Response compression with `compression` middleware
- Response caching headers for public GET endpoints
- Cursor-based pagination for large collections
- Image optimization on upload

#### Monitoring & Docs:
- API documentation with Swagger/OpenAPI auto-generation
- Health check endpoints (readiness + liveness probes)
- Structured error logging with Winston
- Request/response timing

#### Deployment:
- Environment profiles (dev / staging / production)
- Graceful shutdown handling (SIGTERM/SIGINT)
- Docker support (optional)
- Deployment guide for hosting platforms

---

## 🔧 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500,https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FORM_RATE_LIMIT_MAX=5

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_NOTIFICATION_EMAIL=info@greenwoodschool.edu.in
```

---

## 📊 Firestore Collection Map

| Collection Name | Source Page | Type |
|---|---|---|
| `admission-enquiries` | admission.html | Form submissions |
| `contact-inquiries` | contact.html | Form submissions |
| `alumni-registrations` | alumni.html | Form submissions |
| `announcements` | index.html, news.html | Dynamic content |
| `ticker-items` | index.html | Dynamic content |
| `circulars` | news.html | File uploads |
| `holidays` | news.html | Dynamic content |
| `upcoming-events` | news.html | Dynamic content |
| `gallery` | gallery.html | Image uploads |
| `faculty` | faculty.html | Dynamic content |
| `staff` | faculty.html | Dynamic content |
| `student-achievements` | achievements.html | Dynamic content |
| `awards` | achievements.html | Dynamic content |
| `curriculum` | academics.html | Dynamic content |
| `academic-calendar` | academics.html | Dynamic content |
| `exam-info` | academics.html | Dynamic content |
| `student-life` | student-life.html | Dynamic content (categorized) |
| `parent-downloads` | parents.html | File uploads |
| `parent-circulars` | parents.html | Dynamic content |
| `pta` | parents.html | Dynamic content |
| `alumni-stories` | alumni.html | Dynamic content |
| `alumni-events` | alumni.html | Dynamic content |

---

## ✅ Verification Plan

| Phase | Test |
|-------|------|
| **Phase 1** | `GET /api/health` returns 200 with Firebase status |
| **Phase 2** | Admin login → token → protected route → unauthorized rejection |
| **Phase 3** | Form submit via browser → data in Firestore → rate limit blocks abuse |
| **Phase 4** | Full CRUD cycle for each content type via Postman/curl |
| **Phase 5** | Browser test: forms work, content loads dynamically, admin panel functional |
| **Phase 6** | Security audit, load testing, error logging verification |

---

## 📝 Notes

- Backend will be created inside `backend/` directory to keep it separate from the existing frontend
- `serviceAccountKey.json` must NEVER be committed to git
- All timestamps stored in Firestore will use ISO 8601 format
- Pagination defaults: page=1, limit=10, max=100
- File upload limits: images 5MB max, PDFs 10MB max
- Allowed image types: jpg, jpeg, png, webp
- Allowed document types: pdf

---

*Implementation Plan v1.0 — Greenwood Public School Backend*  
*Tech Stack: Node.js + Express.js + Firebase (Firestore + Auth + Storage)*
