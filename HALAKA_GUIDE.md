# Halaka API Documentation

_Last updated: July 19, 2025_

Base Route: `/api/v1/halaka`

---

## Table of Contents

- [General Notes](#general-notes)
- [Create Halaka](#create-halaka)
- [Update Halaka](#update-halaka)
- [Delete Halaka](#delete-halaka)
- [Get All Halakat](#get-all-halakat)
- [Get Halaka By ID](#get-halaka-by-id)
- [Get Halakat By Teacher](#get-halakat-by-teacher)
- [Get Upcoming Sessions](#get-upcoming-sessions)
- [Get Halaka Attendance](#get-halaka-attendance)
- [Validation and Authorization](#validation-and-authorization)

---

## General Notes

- **All routes require JWT authentication.**
- **Teacher authorization required** for all endpoints.
- Field/type/validation errors follow a unified structure.
- `halqaType`: `"private"` for 1-to-1 halakat, `"halqa"` for group halakat.
- The price for `"private"` halakat is automatically set from the teacher's profile (`sessionPrice`) on create/update.
- All dates/times are in ISO 8601 (`UTC`) format.

---

## Create Halaka

**POST** `/api/v1/halaka/`

### Description

Create a new halaka (private or group).

- If `halqaType` is `"private"`, the price is auto-set from the teacher’s `sessionPrice`.
- Required body fields depend on halqaType.

### Request Headers

- `Authorization: Bearer `

### Request Body

```

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
  - The `price` field is ignored; will be auto-set from the teacher model’s `sessionPrice`.
- If `halqaType` = `"halqa"`:
  - The `maxStudents` and `price` must be provided.

### Success Response

- **Code:** `201 CREATED`
- **Content:**

```

{
"status": "created",
"message": "Halaka created successfully",
"data": { ...halakaObject }
}

```

---

## Update Halaka

**PUT** `/api/v1/halaka/:id`

### Description

Update fields for an existing halaka.

- For `"private"` halakat, price will always be set to the teacher’s `sessionPrice` (even if sent in the request).

### Request Headers

- `Authorization: Bearer `

### Request Body

Provide any fields you wish to change (all optional):

```

{
"title": "حلقة جديدة",
"description": "تحديث الشرح",
"schedule": { ... },
"curriculum": "tajweed",
"maxStudents": 10,
"price": 120,
"status": "active"
}

```

### Success Response

```

{
"status": "success",
"message": "Halaka updated successfully",
"data": { ...updatedHalaka }
}

```

---

## Delete Halaka

**DELETE** `/api/v1/halaka/:id`

### Description

Deletes a halaka and all related sessions. Only the assigned teacher may delete.

### Request Headers

- `Authorization: Bearer `

### Success Response

```

{
"status": "success",
"message": "Halaka and all related data deleted successfully"
}

```

---

## Get All Halakat

**GET** `/api/v1/halaka/`

### Description

Get all halakat (with optional filtering).

### Request Headers

- `Authorization: Bearer `

### Query Parameters

- `teacher` (optional): Filter by teacher's Mongo id.
- `status` (optional): `"scheduled"`, `"active"`, `"completed"`, `"cancelled"`

### Success Response

```

{
"status": "success",
"message": "Halakat fetched successfully",
"data": [ ...halakat ]
}

```

---

## Get Halaka By ID

**GET** `/api/v1/halaka/:id`

### Description

Fetch one halaka by Mongo id. Teacher must own the halaka.

### Request Headers

- `Authorization: Bearer `

### Success Response

```

{
"status": "success",
"message": "Halaka fetched successfully",
"data": { ...halaka }
}

```

---

## Get Halakat By Teacher

**GET** `/api/v1/halaka/teacher/:teacherId`

### Description

Fetch all halakat for a given teacher.

### Request Headers

- `Authorization: Bearer `

### Success Response

```

{
"status": "success",
"message": "Halakat fetched successfully",
"data": [
{ ...halaka1 }, { ...halaka2 }
]
}

```

---

## Get Upcoming Sessions

**GET** `/api/v1/halaka/:id/next-sessions`

### Description

Get the next 5 scheduled sessions for a specific halaka.

### Request Headers

- `Authorization: Bearer `

### Success Response

```

{
"status": "success",
"message": "Next session list",
"data": [
{
"scheduledDate": "2025-09-01T00:00:00.000Z",
"scheduledStartTime": "17:00",
"scheduledEndTime": "18:00",
"zoomMeeting": { ... },
"status": "scheduled" // or "in-progress"/"completed"
}
]
}

```

---

## Get Halaka Attendance

**GET** `/api/v1/halaka/:id/attendance?date=YYYY-MM-DD` (optional date filter)

### Description

Get attendance records (per student per session).

### Request Headers

- `Authorization: Bearer `

### Query Parameters

- `date` (optional): Filter by session date (ISO format)

### Success Response

```

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
"status": "present",
"timeIn": "...",
"timeOut": "..."
}
]
}
]
}

```

---

## Validation and Authorization

- All endpoints require authentication.
- **Teacher role is enforced** on all CRUD endpoints.
- Detailed validation error messages are returned for all bad or missing data.
- All ObjectId values must be valid MongoDB IDs.

---

## Error/Validation Response

```

{
"status": "validationError" | "error",
"message": "Description of the error",
"errors": [ "field-specific errors if any" ]
}

```

---

## Example: Create Group Halaka

```

POST /api/v1/halaka/
Authorization: Bearer
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

```

POST /api/v1/halaka/
Authorization: Bearer
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
