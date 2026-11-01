# API Documentation — Greenwood Public School Backend

**Base URL:** `http://localhost:5000/api` (development) | `https://yourdomain.com/api` (production)

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Admissions](#admissions)
  - [Contact](#contact)
  - [Alumni Registration](#alumni-registration)
  - [News](#news)
  - [Ticker](#ticker)
  - [Events](#events)
  - [Gallery](#gallery)
  - [Faculty](#faculty)
  - [Staff](#staff)
  - [Achievements](#achievements)
  - [Awards](#awards)
  - [Academics](#academics)
  - [Student Life](#student-life)
  - [Parents](#parents)
  - [Alumni Content](#alumni-content)

---

## Authentication

Admin-protected endpoints require a Firebase ID token in the `Authorization` header.

```
Authorization: Bearer <firebase-id-token>
```

**Getting a token:**
1. Sign in with Firebase Auth on the client side
2. Call `firebase.auth().currentUser.getIdToken()`
3. Send the token in the Authorization header

**Admin access:** The user must have a custom claim `admin: true` set via Firebase Admin SDK.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": ""
    }
  ]
}
```

---

## Error Codes

| Status | Meaning | Common Cause |
|--------|---------|--------------|
| 400 | Bad Request | Invalid JSON, validation failure, bad file type |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Non-admin user attempting admin action |
| 404 | Not Found | Resource or route doesn't exist |
| 408 | Request Timeout | Server took too long to respond |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File exceeds size limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Firebase not configured |

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Form submissions | 5 requests | 15 minutes |

Rate limit info is returned in response headers:
- `RateLimit-Limit` — Max requests allowed
- `RateLimit-Remaining` — Requests remaining
- `RateLimit-Reset` — Time when the limit resets

---

## Request Headers

All responses include:
- `X-Request-Id` — Unique request identifier for debugging
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` — CSP directives

---

## Endpoints

### Health

#### `GET /api/health`

Returns server health status, memory usage, and Firebase connectivity.

**Response:**
```json
{
  "success": true,
  "message": "All systems operational",
  "data": {
    "status": "healthy",
    "timestamp": "2026-08-02T19:00:00.000Z",
    "uptime": "2h 15m 30s",
    "environment": "production",
    "nodeVersion": "v20.11.0",
    "firebase": {
      "connected": true,
      "latencyMs": 45
    },
    "memory": {
      "rss": "85.2 MB",
      "heapUsed": "42.1 MB",
      "heapTotal": "65.8 MB",
      "external": "2.3 MB"
    },
    "requestCount": 1234,
    "version": "1.0.0"
  }
}
```

---

### Auth

#### `POST /api/auth/login`

Verify a Firebase ID token and return user info.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "abc123",
    "email": "admin@school.com",
    "name": "Admin",
    "isAdmin": true
  }
}
```

#### `GET /api/auth/verify`

Check if the current token is still valid.

**Headers:** `Authorization: Bearer <token>`

---

### Admissions

#### `POST /api/admissions` *(public, rate-limited)*

Submit a new admission enquiry.

**Body:**
```json
{
  "studentName": "Rahul Sharma",
  "parentName": "Mr. Sharma",
  "email": "parent@email.com",
  "phone": "9876543210",
  "dob": "2018-05-15",
  "classApplied": "nursery",
  "message": "Interested in admission for 2027 session"
}
```

**Valid classes:** `nursery`, `jr-kg`, `sr-kg`, `1`–`9`

#### `GET /api/admissions` *(admin)*

List all enquiries with pagination.

**Query params:** `page`, `limit`, `orderBy`, `order`, `status`

#### `GET /api/admissions/:id` *(admin)*
#### `PATCH /api/admissions/:id` *(admin)* — Update status/notes
#### `DELETE /api/admissions/:id` *(admin)*

---

### Contact

#### `POST /api/contact` *(public, rate-limited)*

Submit a contact form inquiry.

**Body:**
```json
{
  "name": "Parent Name",
  "email": "parent@email.com",
  "phone": "9876543210",
  "subject": "Fee inquiry",
  "message": "What are the fees for Class 5?"
}
```

#### `GET /api/contact` *(admin)* — List with pagination
#### `GET /api/contact/:id` *(admin)*
#### `PATCH /api/contact/:id` *(admin)*
#### `DELETE /api/contact/:id` *(admin)*

---

### Alumni Registration

#### `POST /api/alumni` *(public, rate-limited)*

Register as an alumnus.

**Body:**
```json
{
  "name": "Alumni Name",
  "email": "alumni@email.com",
  "phone": "9876543210",
  "batchYear": "2010",
  "currentOccupation": "Software Engineer",
  "message": "Proud to be an alumnus"
}
```

#### `GET /api/alumni` *(admin)* — List
#### `GET /api/alumni/:id` *(admin)*
#### `DELETE /api/alumni/:id` *(admin)*

---

### News

#### Announcements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/news/announcements` | Public | List published announcements |
| GET | `/api/news/announcements/all` | Admin | List all (including unpublished) |
| GET | `/api/news/announcements/:id` | Admin | Get single |
| POST | `/api/news/announcements` | Admin | Create |
| PUT | `/api/news/announcements/:id` | Admin | Update |
| DELETE | `/api/news/announcements/:id` | Admin | Delete |

#### Circulars

Same pattern at `/api/news/circulars`

#### Holidays

Same pattern at `/api/news/holidays`

---

### Ticker

#### `GET /api/ticker` *(public)*

Get active ticker items for the homepage scrolling ticker.

---

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Public | List upcoming events |
| GET | `/api/events/:id` | Admin | Get single |
| POST | `/api/events` | Admin | Create |
| PUT | `/api/events/:id` | Admin | Update |
| DELETE | `/api/events/:id` | Admin | Delete |

---

### Gallery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gallery` | Public | List images (filter: `?category=sports`) |
| POST | `/api/gallery` | Admin | Upload image (multipart: `image` field) |
| PUT | `/api/gallery/:id` | Admin | Update (multipart: optional `image`) |
| DELETE | `/api/gallery/:id` | Admin | Delete (also removes from storage) |

**Categories:** `campus`, `pre-primary`, `sports`, `cultural`, `trips`, `events`, `other`

---

### Faculty

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/faculty` | Public | List faculty (sorted by `order`) |
| POST | `/api/faculty` | Admin | Create |
| PUT | `/api/faculty/:id` | Admin | Update |
| DELETE | `/api/faculty/:id` | Admin | Delete |

### Staff

Same pattern at `/api/staff`

---

### Achievements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/achievements` | Public | List (filter: `?category=`) |
| POST | `/api/achievements` | Admin | Create |
| PUT | `/api/achievements/:id` | Admin | Update |
| DELETE | `/api/achievements/:id` | Admin | Delete |

### Awards

Same CRUD pattern at `/api/awards`

---

### Academics

Three sub-sections:

#### Curriculum: `/api/academics/curriculum`
#### Calendar: `/api/academics/calendar`
#### Exams: `/api/academics/exams`

Each follows:

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/academics/{section}` | Public |
| GET | `/api/academics/{section}/all` | Admin |
| POST | `/api/academics/{section}` | Admin |
| PUT | `/api/academics/{section}/:id` | Admin |
| DELETE | `/api/academics/{section}/:id` | Admin |

---

### Student Life

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/student-life` | Public | List (filter: `?category=sports`) |
| POST | `/api/student-life` | Admin | Create (multipart: `image`) |
| PUT | `/api/student-life/:id` | Admin | Update (multipart: optional `image`) |
| DELETE | `/api/student-life/:id` | Admin | Delete |

**Categories:** `sports`, `cultural`, `competitions`, `trips`

---

### Parents

Three sub-sections:

#### Downloads: `/api/parents/downloads`
#### Circulars: `/api/parents/circulars`
#### PTA: `/api/parents/pta`

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/parents/{section}` | Public |
| POST | `/api/parents/{section}` | Admin (with file upload for downloads/circulars) |
| PUT | `/api/parents/{section}/:id` | Admin |
| DELETE | `/api/parents/{section}/:id` | Admin |

---

### Alumni Content

#### Stories: `/api/alumni-content/stories`
#### Events: `/api/alumni-content/events`

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/alumni-content/{section}` | Public (published only) |
| GET | `/api/alumni-content/{section}/all` | Admin |
| POST | `/api/alumni-content/{section}` | Admin |
| PUT | `/api/alumni-content/{section}/:id` | Admin |
| DELETE | `/api/alumni-content/{section}/:id` | Admin |

---

## Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |
| `orderBy` | string | Sort field (default: `createdAt`) |
| `order` | string | Sort direction: `asc` or `desc` (default: `desc`) |
| `category` | string | Filter by category (where applicable) |
| `status` | string | Filter by status: `new`, `read`, `replied`, `archived` |
