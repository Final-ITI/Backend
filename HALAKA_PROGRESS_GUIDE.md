# Halaka Progress API Guide

This document provides details on the API endpoints related to managing and retrieving student progress within a Halaka. These endpoints are primarily intended for use by teachers to view and update progress, and by students to view their own progress.

## Base URL

All endpoints are prefixed with `/api/v1`.

---

## 1. Get Halaka Progress

Retrieves the detailed progress of all students in a specific Halaka. This endpoint is accessible by teachers to view overall progress and by students to view their own progress within a halaka.

**Endpoint:** `GET /halaka/:halakaId/progress`
**Authentication:** Required (Bearer Token)
**Authorization:** `teacher` (to get all students' progress) or `student` (to get their own progress in halaka details)

### Request Parameters

| Parameter  | Type     | Description                         |
| :--------- | :------- | :---------------------------------- |
| `halakaId` | `String` | **Required**. The ID of the Halaka. |

### Example Response (Teacher View)

```json
{
  "status": "success",
  "message": "تم جلب تقدم الطلاب بنجاح",
  "data": {
    "halakaId": "65b93d0f0c0d1e2f3g4h5i6j",
    "studentProgress": [
      {
        "studentId": "65b93d0f0c0d1e2f3g4h5k7l",
        "fullName": "Student One",
        "progress": [
          {
            "sessionNumber": 1,
            "sessionDate": "2025-07-16",
            "status": "present",
            "score": 8,
            "notes": "Excellent participation."
          },
          {
            "sessionNumber": 2,
            "sessionDate": "2025-07-21",
            "status": "absent",
            "score": null,
            "notes": ""
          }
        ]
      },
      {
        "studentId": "65b93d0f0c0d1e2f3g4h5m8n",
        "fullName": "Student Two",
        "progress": [
          {
            "sessionNumber": 1,
            "sessionDate": "2025-07-16",
            "status": "present",
            "score": 9,
            "notes": "Very good understanding."
          },
          {
            "sessionNumber": 2,
            "sessionDate": "2025-07-21",
            "status": "late",
            "score": 7,
            "notes": "Arrived late."
          }
        ]
      }
    ],
    "sessionsData": [
      {
        "sessionNumber": 1,
        "sessionDate": "2025-07-16",
        "attendanceId": "attendanceDocId1"
      },
      {
        "sessionNumber": 2,
        "sessionDate": "2025-07-21",
        "attendanceId": "attendanceDocId2"
      }
    ]
  }
}
```

### Response Fields

- `halakaId`: The ID of the Halaka.
- `studentProgress`: An array of student progress objects.
  - `studentId`: The ID of the student.
  - `fullName`: The full name of the student.
  - `progress`: An array of session progress objects for this student.
    - `sessionNumber`: The ordinal number of the session.
    - `sessionDate`: The date of the session (YYYY-MM-DD).
    - `status`: Attendance status (`present`, `absent`, `late`, `excused`).
    - `score`: Student's score for the session (1-10), `null` if not recorded.
    - `notes`: Teacher's notes for the session, empty string if none.
- `sessionsData`: An array of session details for the halaka.
  - `sessionNumber`: The ordinal number of the session.
  - `sessionDate`: The date of the session (YYYY-MM-DD).
  - `attendanceId`: The ID of the attendance document for this session (for internal use, can be ignored by frontend if not needed for direct manipulation of attendance records).

---

## 2. Update Halaka Progress

Allows a teacher to update a specific student's progress (score and notes) for a given session within a Halaka.

**Endpoint:** `PUT /halaka/:halakaId/progress`
**Authentication:** Required (Bearer Token)
**Authorization:** `teacher`

### Request Body

| Field         | Type     | Description                                                                                                                                                                        |
| :------------ | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `studentId`   | `String` | **Required**. The ID of the student whose progress is being updated.                                                                                                               |
| `sessionDate` | `String` | **Required**. The date of the session in YYYY-MM-DD format (e.g., "2025-07-16"). This must match one of the `sessionDate` values obtained from the `Get Halaka Progress` endpoint. |
| `score`       | `Number` | **Optional**. The student's score for the session (integer from 1 to 10).                                                                                                          |
| `notes`       | `String` | **Optional**. Any textual notes for the student's performance in this session.                                                                                                     |

### Example Request Body

```json
{
  "studentId": "65b93d0f0c0d1e2f3g4h5k7l",
  "sessionDate": "2025-07-16",
  "score": 8,
  "notes": "Student showed excellent understanding of the new topic."
}
```

### Example Response

```json
{
  "status": "success",
  "message": "تم تحديث تقدم الطالب بنجاح",
  "data": {
    "halakaId": "65b93d0f0c0d1e2f3g4h5i6j",
    "studentId": "65b93d0f0c0d1e2f3g4h5k7l",
    "sessionDate": "2025-07-16",
    "score": 8,
    "notes": "Student showed excellent understanding of the new topic."
  }
}
```

---
