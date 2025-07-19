# Halaka API Documentation

_Last updated: July 20, 2025_

Base Route: `/api/v1/halaka`

---

## Table of Contents

- [General Notes](#general-notes)
- [Create Halaka](#create-halaka)
- [Update Halaka](#update-halaka)
- [Delete Halaka](#delete-halaka)
- [Get All Halakat (With Advanced Filtering)](#get-all-halakat-with-advanced-filtering)
- [Get Halaka By ID](#get-halaka-by-id)
- [Get Halakat By Teacher](#get-halakat-by-teacher)
- [Get Upcoming Sessions](#get-upcoming-sessions)
- [Get Halaka Attendance](#get-halaka-attendance)
- [Validation and Authorization](#validation-and-authorization)

---

## General Notes

- **All routes require JWT authentication** except for `Get All Halakat`.
- **Teacher authorization required** for most endpoints.
- Field/type/validation errors follow a unified structure.
- `halqaType`: `"private"` for 1-to-1 halakat, `"halqa"` for group halakat.
- The price for `"private"` halakat is automatically set from the teacher's profile (`sessionPrice`) on create/update.
- All dates/times are in ISO 8601 (`UTC`) format.
- Advanced filtering supports flexible teacher name search (first, last, or full name in any order).

---

## Create Halaka

**POST** `/api/v1/halaka/`

### Description

Create a new halaka (private or group).

- If `halqaType` is `"private"`, the price is auto-set from the teacher's `sessionPrice`.
- Required body fields depend on halqaType.
- For group halakat, a chat group is automatically created.

### Request Headers

- `Authorization: Bearer <token>`

### Request Body

```json
{
  "title": "حلقة لحفظ جزء عم",
  "description": "خاص بالطلاب المبتدئين",
  "halqaType": "halqa", // or "private"
  "schedule": {
    "frequency": "weekly",
    "days": ["monday", "wednesday"],
    "startTime": "17:00",
    "duration": 60,
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-12-01T00:00:00.000Z",
    "timezone": "Africa/Cairo"
  },
  "curriculum": "quran_memorization",
  "maxStudents": 10,
  "price": 100 // required for "halqa" only
}
```

#### Required / Conditional Fields

| Field       | Type   | Required? | Notes                                                    |
| ----------- | ------ | --------- | -------------------------------------------------------- |
| title       | string | Yes       |                                                          |
| description | string | No        |                                                          |
| halqaType   | string | Yes       | "private" \| "halqa"                                     |
| schedule    | object | Yes       | See above                                                |
| curriculum  | string | Yes       | (see below for options)                                  |
| maxStudents | int    | Yes\*     | Required if `halqaType` = "halqa"                        |
| student     | string | Yes\*     | studentId, required if `halqaType` = "private"           |
| price       | number | Yes\*     | required if `halqaType` = "halqa", ignored for "private" |

> `curriculum`: `"quran_memorization"`, `"tajweed"`, `"arabic"`, `"islamic_studies"`

**Special Behavior**

- If `halqaType` = `"private"`:
  - The `student` field is required.
  - The `price` field is ignored; will be auto-set from the teacher model's `sessionPrice`.
  - `maxStudents` is automatically set to 1.
- If `halqaType` = `"halqa"`:
  - The `maxStudents` and `price` must be provided.
  - A chat group is automatically created and linked to the halaka.

### Success Response

- **Code:** `201 CREATED`
- **Content:**

```json
{
  "status": "created",
  "message": "Halaka created successfully",
  "data": {
    "_id": "60ff234...",
    "title": "حلقة لحفظ جزء عم",
    "teacher": "6091f8a...",
    "halqaType": "halqa",
    "schedule": { ... },
    "curriculum": "quran_memorization",
    "maxStudents": 10,
    "currentStudents": 0,
    "price": 100,
    "status": "scheduled",
    "chatGroup": "6092a1b..." // for group halakat only
  }
}
```

---

## Update Halaka

**PUT** `/api/v1/halaka/:id`

### Description

Update fields for an existing halaka.

- For `"private"` halakat, price will always be set to the teacher's `sessionPrice` (even if sent in the request).
- Only the teacher who created the halaka can update it.

### Request Headers

- `Authorization: Bearer <token>`

### Request Body

Provide any fields you wish to change (all optional):

```json
{
  "title": "حلقة جديدة",
  "description": "تحديث الشرح",
  "schedule": {
    "frequency": "weekly",
    "days": ["sunday"],
    "startTime": "18:00",
    "duration": 90
  },
  "curriculum": "tajweed",
  "maxStudents": 10,
  "price": 120,
  "status": "active"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Halaka updated successfully",
  "data": {
    "_id": "60ff234...",
    "title": "حلقة جديدة"
    // ...updated fields...
  }
}
```

---

## Delete Halaka

**DELETE** `/api/v1/halaka/:id`

### Description

Deletes a halaka and all related sessions. Only the assigned teacher may delete.

### Request Headers

- `Authorization: Bearer <token>`

### Success Response

```json
{
  "status": "success",
  "message": "Halaka and all related data deleted successfully"
}
```

---

## Get All Halakat (With Advanced Filtering)

**GET** `/api/v1/halaka/`

### Description

Get all halakat with advanced filtering and pagination capabilities.

- **No authentication required** for this endpoint.
- Supports flexible teacher name search (first, last, or full name in any order).
- Full pagination support with metadata.

### Query Parameters

| Parameter     | Type   | Description                                                                                  | Example                   |
| ------------- | ------ | -------------------------------------------------------------------------------------------- | ------------------------- |
| `title`       | String | Filter by (substring, case-insensitive) Halaka title                                         | `title=Quran`             |
| `curriculum`  | String | Filter by curriculum name                                                                    | `curriculum=hafs`         |
| `status`      | String | Filter by status (`"scheduled"`, `"active"`, `"completed"`, `"cancelled"`)                   | `status=active`           |
| `teacher`     | String | Filter by teacher ObjectId (exact match)                                                     | `teacher=60ab...c9f6`     |
| `teacherName` | String | Filter by teacher's first, last, or full name (flexible: `nesma`, `fayed`, or `nesma fayed`) | `teacherName=nesma fayed` |
| `page`        | Int    | Page number for pagination (default: 1)                                                      | `page=1`                  |
| `limit`       | Int    | Page size (default: 10)                                                                      | `limit=5`                 |

### Flexible Name Search (`teacherName`)

Supports searching by **first name**, **last name**, or **full name** in any order:

- `teacherName=nesma` matches teachers whose first/last name contains "nesma"
- `teacherName=nesma fayed` matches:
  - Teachers with `firstName` ≈ "nesma" and `lastName` ≈ "fayed"
  - Teachers with `firstName` ≈ "fayed" and `lastName` ≈ "nesma"
  - Teachers where full name (first or last) contains the string

### Example Requests

- Get page 1, 5 per page, filter by title:
  ```
  GET /api/v1/halaka?title=Quran&limit=5&page=1
  ```
- Filter by teacher full name:
  ```
  GET /api/v1/halaka?teacherName=nesma fayed
  ```
- Combined filters:
  ```
  GET /api/v1/halaka?curriculum=hafs&status=active&teacherName=ahmed&page=2&limit=10
  ```

### Success Response

```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "timestamp": "2025-07-20T01:28:17.000Z",
  "data": [
    {
      "_id": "60ff234...",
      "title": "Quran for Beginners",
      "curriculum": "hafs",
      "status": "active",
      "teacher": {
        "_id": "6091f8a...",
        "userId": "6081d2b..."
        // ...teacher details populated...
      }
      // ...other halaka fields...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

## Get Halaka By ID

**GET** `/api/v1/halaka/:id`

### Description

Fetch one halaka by Mongo id. Teacher must own the halaka.

### Request Headers

- `Authorization: Bearer <token>`

### Success Response

```json
{
  "status": "success",
  "message": "Halaka fetched successfully",
  "data": {
    "_id": "60ff234...",
    "title": "حلقة لحفظ جزء عم",
    "teacher": "6091f8a...",
    "halqaType": "halqa"
    // ...complete halaka object...
  }
}
```

---

## Get Halakat By Teacher

**GET** `/api/v1/halaka/teacher/:teacherId`

### Description

Fetch all halakat for the authenticated teacher (uses teacher from JWT token, not URL parameter).

### Request Headers

- `Authorization: Bearer <token>`

### Success Response

```json
{
  "status": "success",
  "message": "Halakat fetched successfully",
  "data": [
    {
      "_id": "60ff234...",
      "title": "حلقة لحفظ جزء عم"
      // ...halaka1...
    },
    {
      "_id": "60ff235...",
      "title": "حلقة التجويد"
      // ...halaka2...
    }
  ]
}
```

---

## Get Upcoming Sessions

**GET** `/api/v1/halaka/:id/next-sessions`

### Description

Get the next 5 scheduled sessions for a specific halaka with real-time status calculation.

### Request Headers

- `Authorization: Bearer <token>`

### Success Response

```json
{
  "status": "success",
  "message": "Next session list",
  "data": [
    {
      "scheduledDate": "2025-09-01T00:00:00.000Z",
      "scheduledStartTime": "17:00",
      "scheduledEndTime": "18:00",
      "zoomMeeting": {
        "meetingId": "123456789",
        "joinUrl": "https://zoom.us/j/123456789",
        "password": "abc123"
      },
      "status": "scheduled" // or "in-progress"/"completed"
    }
    // ...up to 5 sessions...
  ]
}
```

### Session Status Logic

- `"scheduled"`: Session is in the future
- `"in-progress"`: Current time is between start and end time
- `"completed"`: Session end time has passed

---

## Get Halaka Attendance

**GET** `/api/v1/halaka/:id/attendance?date=YYYY-MM-DD` (optional date filter)

### Description

Get attendance records for a specific halaka (per student per session).

### Request Headers

- `Authorization: Bearer <token>`

### Query Parameters

- `date` (optional): Filter by session date (ISO format YYYY-MM-DD)

### Success Response

```json
{
  "status": "success",
  "message": "Attendance data fetched",
  "data": [
    {
      "sessionDate": "2025-10-01T00:00:00.000Z",
      "records": [
        {
          "student": {
            "id": "65325e84...",
            "firstName": "Omar",
            "lastName": "Saeed",
            "email": "omar@example.com"
          },
          "status": "present", // or "absent"
          "timeIn": "2025-10-01T17:05:00.000Z",
          "timeOut": "2025-10-01T18:00:00.000Z"
        }
        // ...more student records...
      ]
    }
    // ...more session dates...
  ]
}
```

---

## Validation and Authorization

- Most endpoints require authentication via JWT token in Authorization header.
- **Teacher role is enforced** on all CRUD endpoints except `Get All Halakat`.
- Teachers can only access/modify their own halakat (except for the public listing).
- Detailed validation error messages are returned for all bad or missing data.
- All ObjectId values must be valid MongoDB IDs.

### Validation Rules

#### Create Halaka

- `title`: Required, string
- `halqaType`: Required, must be "private" or "halqa"
- `schedule`: Required object with valid date/time fields
- `curriculum`: Required, must be one of predefined values
- `price`: Required for group halakat, positive number
- `maxStudents`: Required for group halakat, positive integer
- `student`: Required for private halakat, valid ObjectId

#### Update Halaka

- All fields optional
- Same validation rules apply when fields are provided
- Private halaka prices are automatically overridden

---

## Error/Validation Response

```json
{
  "status": "validationError" | "error",
  "message": "Description of the error",
  "errors": [ "field-specific errors if any" ]
}
```

### Common Error Codes

- **400 Bad Request**: Validation errors or missing required fields
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions (not a teacher, or not owner)
- **404 Not Found**: Halaka not found or not accessible
- **500 Internal Server Error**: Server-side errors

---

## Example: Create Group Halaka

```http
POST /api/v1/halaka/
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "حفظ سورة الكهف",
  "halqaType": "halqa",
  "schedule": {
    "frequency": "weekly",
    "days": ["friday"],
    "startTime": "18:00",
    "duration": 90,
    "startDate": "2025-08-01T00:00:00.000Z",
    "endDate": "2025-12-01T00:00:00.000Z",
    "timezone": "Africa/Cairo"
  },
  "curriculum": "quran_memorization",
  "maxStudents": 15,
  "price": 150
}
```

## Example: Create Private Halaka

```http
POST /api/v1/halaka/
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "حلقة خصوصية",
  "halqaType": "private",
  "student": "64b63a...studentId...",
  "schedule": {
    "frequency": "weekly",
    "days": ["sunday"],
    "startTime": "16:00",
    "duration": 60,
    "startDate": "2025-08-01T00:00:00.000Z",
    "endDate": "2025-10-01T00:00:00.000Z",
    "timezone": "Africa/Cairo"
  },
  "curriculum": "tajweed"
}
```

## Example: Advanced Filtering

```http
GET /api/v1/halaka?teacherName=ahmed ali&curriculum=quran_memorization&status=active&page=1&limit=10
```

## Example: Get Attendance for Specific Date

```http
GET /api/v1/halaka/60ff234.../attendance?date=2025-10-01
Authorization: Bearer <your-jwt-token>
```

---

## Frontend Integration Tips

### Next.js/React Example

```javascript
// Get filtered halakat with pagination
const getHalakat = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/v1/halaka?${params}`);
  return response.json();
};

// Usage
const data = await getHalakat({
  teacherName: "ahmed",
  curriculum: "quran_memorization",
  page: 1,
  limit: 10,
});
```

### Error Handling Pattern

```javascript
try {
  const response = await fetch("/api/v1/halaka", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(halakaData),
  });

  const result = await response.json();

  if (result.status === "created") {
    // Success
    console.log("Halaka created:", result.data);
  } else {
    // Handle validation or other errors
    console.error("Error:", result.message);
  }
} catch (error) {
  console.error("Network error:", error);
}
```
