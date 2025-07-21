# Halaka API Documentation

## Overview

The Halaka API provides comprehensive endpoints for managing Islamic study circles (Halakat). The system supports both private (one-on-one) and group study sessions with features including scheduling, attendance tracking, session management, and analytics.

## Table of Contents

- [Authentication](#authentication)
- [Base Information](#base-information)
- [Halaka Management](#halaka-management)
- [Session Management](#session-management)
- [Attendance Management](#attendance-management)
- [Student Management](#student-management)
- [Analytics](#analytics)
- [Error Handling](#error-handling)
- [Validation](#validation)

## Authentication

All endpoints require JWT authentication unless otherwise specified.

### Headers Required

```
Authorization: Bearer
Content-Type: application/json
```

### Roles

- `teacher`: Required for all Halaka management operations
- Only the teacher who owns a Halaka can perform operations on it

## Base Information

**Base URL:** `/api/v1/halaka`

**Response Format:**

```json
{
  "status": "success|created|error|validationError",
  "message": "Arabic response message",
  "timestamp": "ISO 8601 timestamp",
  "data": "Response data in English"
}
```

## Halaka Management

### Create Halaka

**POST** `/api/v1/halaka/`

Creates a new Halaka. For private sessions, the price is automatically set from the teacher's profile.

#### Request Body

| Field       | Type   | Required    | Description                            |
| ----------- | ------ | ----------- | -------------------------------------- |
| title       | string | Yes         | Halaka title                           |
| description | string | No          | Halaka description                     |
| halqaType   | string | Yes         | "private" or "halqa"                   |
| student     | string | Conditional | Student ID (required for private)      |
| schedule    | object | Yes         | Schedule configuration                 |
| curriculum  | string | Yes         | Curriculum type                        |
| maxStudents | number | Conditional | Max students (required for group)      |
| price       | number | Conditional | Price per session (required for group) |

#### Schedule Object

```json
{
  "frequency": "weekly",
  "days": ["monday", "wednesday"],
  "startTime": "17:00",
  "duration": 60,
  "startDate": "2025-08-01T00:00:00.000Z",
  "endDate": "2025-10-31T00:00:00.000Z",
  "timezone": "Africa/Cairo"
}
```

#### Example Request (Group Halaka)

```json
{
  "title": "Advanced Tajweed Course",
  "description": "Learn advanced Tajweed rules",
  "halqaType": "halqa",
  "schedule": {
    "frequency": "weekly",
    "days": ["sunday", "tuesday"],
    "startTime": "18:00",
    "duration": 90,
    "startDate": "2025-08-01T00:00:00.000Z",
    "endDate": "2025-12-01T00:00:00.000Z",
    "timezone": "Africa/Cairo"
  },
  "curriculum": "tajweed",
  "maxStudents": 15,
  "price": 150
}
```

#### Success Response

```json
{
  "status": "created",
  "message": "تم إنشاء الحلقة بنجاح",
  "timestamp": "2025-07-21T14:30:00.000Z",
  "data": {
    "_id": "60f1234567890abcdef12345",
    "title": "Advanced Tajweed Course",
    "description": "Learn advanced Tajweed rules",
    "halqaType": "halqa",
    "status": "scheduled",
    "curriculum": "tajweed",
    "schedule": {
      "frequency": "weekly",
      "days": ["sunday", "tuesday"],
      "startTime": "18:00",
      "duration": 90,
      "startDate": "2025-08-01T00:00:00.000Z",
      "endDate": "2025-12-01T00:00:00.000Z",
      "timezone": "Africa/Cairo"
    },
    "maxStudents": 15,
    "currentStudents": 0,
    "price": 150,
    "totalSessions": 35,
    "totalPrice": 5250
  }
}
```

### Get All Public Halakat

**GET** `/api/v1/halaka/`

Retrieves all public group Halakat with filtering and pagination.

#### Query Parameters

| Parameter   | Type   | Description                        |
| ----------- | ------ | ---------------------------------- |
| page        | number | Page number (default: 1)           |
| limit       | number | Items per page (default: 10)       |
| title       | string | Filter by title (case-insensitive) |
| curriculum  | string | Filter by curriculum               |
| status      | string | Filter by status                   |
| teacher     | string | Filter by teacher ID               |
| teacherName | string | Filter by teacher name             |

#### Example Response

```json
{
  "status": "success",
  "message": "تم جلب الحلقات بنجاح",
  "data": [
    {
      "id": "60f1234567890abcdef12345",
      "title": "Advanced Tajweed",
      "description": "Learn Tajweed rules",
      "teacher": {
        "name": "أ. محمد أحمد",
        "rating": 4.8,
        "studentsCount": 45,
        "profileImage": "/uploads/teachers/teacher1.jpg"
      },
      "curriculum": "tajweed",
      "price": 120,
      "currency": "ج.م",
      "maxStudents": 20,
      "currentStudents": 12,
      "schedule": {
        "days": ["monday", "wednesday"],
        "startTime": "19:00",
        "duration": 60,
        "frequency": "weekly"
      },
      "nextSession": "monday - 19:00",
      "location": "أونلاين",
      "status": "active",
      "halqaType": "halqa"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Halaka by ID

**GET** `/api/v1/halaka/:id`

Retrieves a specific Halaka. Teacher must own the Halaka.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب بيانات الحلقة بنجاح",
  "data": {
    "_id": "60f1234567890abcdef12345",
    "title": "Quran Memorization Circle",
    "description": "Memorize and understand Quran",
    "halqaType": "halqa",
    "status": "active",
    "curriculum": "quran_memorization",
    "schedule": {
      "frequency": "weekly",
      "days": ["saturday", "tuesday"],
      "startTime": "20:00",
      "duration": 75,
      "startDate": "2025-08-01T00:00:00.000Z",
      "endDate": "2025-12-01T00:00:00.000Z",
      "timezone": "Africa/Cairo"
    }
  }
}
```

### Update Halaka

**PUT** `/api/v1/halaka/:id`

Updates an existing Halaka. For private Halakat, price is automatically synced with teacher's session price.

#### Request Body

All fields are optional. Include only fields you want to update.

```json
{
  "title": "Updated Halaka Title",
  "status": "active",
  "maxStudents": 25
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "تم تحديث الحلقة بنجاح",
  "data": {
    // Updated halaka object
  }
}
```

### Delete Halaka

**DELETE** `/api/v1/halaka/:id`

Deletes a Halaka and all related sessions and data.

#### Success Response

```json
{
  "status": "success",
  "message": "تم حذف الحلقة وجميع البيانات المتعلقة بها بنجاح",
  "data": null
}
```

### Get Teacher's Halakat

**GET** `/api/v1/halaka/teacher/me`

Retrieves all Halakat belonging to the authenticated teacher.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الحلقات بنجاح",
  "data": [
    // Array of teacher's Halakat
  ]
}
```

## Session Management

### Get Upcoming Sessions

**GET** `/api/v1/halaka/:id/next-sessions`

Retrieves the next 5 upcoming sessions for a Halaka.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الجلسات القادمة بنجاح",
  "data": [
    {
      "scheduledDate": "2025-08-01T00:00:00.000Z",
      "scheduledStartTime": "19:00",
      "scheduledEndTime": "20:30",
      "zoomMeeting": {
        "meetingId": "123456789",
        "password": "abc123",
        "joinUrl": "https://zoom.us/j/123456789"
      },
      "status": "upcoming"
    }
  ]
}
```

### Cancel Session

**POST** `/api/v1/halaka/:id/cancel-session`

Cancels a specific session and extends the schedule accordingly.

#### Request Body

```json
{
  "sessionDate": "2025-08-15T00:00:00.000Z",
  "reason": "Emergency leave"
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "تم إلغاء الجلسة وتحديث الجدول بنجاح",
  "data": {
    "cancelledSession": {
      "sessionDate": "2025-08-15T00:00:00.000Z",
      "reason": "Emergency leave"
    },
    "newEndDate": "2025-12-05T00:00:00.000Z"
  }
}
```

### Get Cancelled Sessions

**GET** `/api/v1/halaka/:id/cancelled-sessions`

Retrieves all cancelled sessions for a Halaka.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الجلسات الملغاة بنجاح",
  "data": {
    "halaka": {
      "id": "60f1234567890abcdef12345",
      "title": "Quran Circle"
    },
    "cancelledSessions": [
      {
        "sessionDate": "2025-08-15T00:00:00.000Z",
        "cancelledAt": "2025-08-10T15:30:00.000Z",
        "reason": "Emergency leave",
        "cancelledBy": "محمد أحمد"
      }
    ],
    "totalCancelled": 1,
    "originalEndDate": "2025-12-01T00:00:00.000Z",
    "extendedEndDate": "2025-12-05T00:00:00.000Z"
  }
}
```

### Restore Session

**POST** `/api/v1/halaka/:id/restore-session`

Restores a previously cancelled session.

#### Request Body

```json
{
  "sessionDate": "2025-08-15T00:00:00.000Z"
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "تم استعادة الجلسة بنجاح",
  "data": {
    "halaka": "60f1234567890abcdef12345",
    "restoredSessionDate": "2025-08-15T00:00:00.000Z",
    "newEndDate": "2025-12-01T00:00:00.000Z",
    "cancelledSessionsCount": 0
  }
}
```

## Attendance Management

### Get Halaka Attendance

**GET** `/api/v1/halaka/:id/attendance`

Retrieves attendance records for all sessions or a specific date.

#### Query Parameters

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| date      | string | Filter by specific date (YYYY-MM-DD format) |

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب بيانات الحضور بنجاح",
  "data": [
    {
      "sessionDate": "2025-08-01T00:00:00.000Z",
      "records": [
        {
          "student": {
            "id": "60f9876543210abcdef67890",
            "firstName": "Omar",
            "lastName": "Mohammed",
            "email": "omar@example.com",
            "profilePicture": "/uploads/students/omar.jpg"
          },
          "status": "present",
          "timeIn": "2025-08-01T19:00:00.000Z",
          "timeOut": "2025-08-01T20:30:00.000Z"
        },
        {
          "student": {
            "id": "60f9876543210abcdef67891",
            "firstName": "Fatima",
            "lastName": "Ahmed",
            "email": "fatima@example.com",
            "profilePicture": "/uploads/students/fatima.jpg"
          },
          "status": "late",
          "timeIn": "2025-08-01T19:15:00.000Z",
          "timeOut": "2025-08-01T20:30:00.000Z"
        }
      ]
    }
  ]
}
```

## Student Management

### Get Halaka Students

**GET** `/api/v1/halaka/:id/students`

Retrieves all students enrolled in a specific Halaka.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب طلاب الحلقة بنجاح",
  "data": [
    {
      "id": "60f9876543210abcdef67890",
      "firstName": "Omar",
      "lastName": "Mohammed",
      "email": "omar@example.com",
      "profilePicture": "/uploads/students/omar.jpg"
    },
    {
      "id": "60f9876543210abcdef67891",
      "firstName": "Fatima",
      "lastName": "Ahmed",
      "email": "fatima@example.com",
      "profilePicture": "/uploads/students/fatima.jpg"
    }
  ]
}
```

## Analytics

### Get Session Analytics

**GET** `/api/v1/halaka/:id/session-analytics`

Provides comprehensive session analytics for a Halaka.

#### Success Response

```json
{
  "status": "success",
  "message": "تم إنشاء تحليلات الجلسات بنجاح",
  "data": {
    "totalSessions": 30,
    "scheduledSessions": 32,
    "cancelledSessions": 2,
    "completedSessions": 18,
    "remainingSessions": 14,
    "extended": true,
    "originalEndDate": "2025-11-30T00:00:00.000Z",
    "currentEndDate": "2025-12-05T00:00:00.000Z"
  }
}
```

### Get Available Enums

**GET** `/api/v1/halaka/enums`

Returns all available enum values for frontend dropdowns.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الخيارات المتاحة بنجاح",
  "data": {
    "halqaType": {
      "halqa": "halqa",
      "private": "private"
    },
    "status": {
      "scheduled": "scheduled",
      "active": "active",
      "completed": "completed",
      "cancelled": "cancelled"
    },
    "curriculum": {
      "quran_memorization": "quran_memorization",
      "tajweed": "tajweed",
      "arabic": "arabic",
      "islamic_studies": "islamic_studies"
    },
    "sessionStatus": {
      "present": "present",
      "absent": "absent",
      "late": "late",
      "excused": "excused"
    },
    "days": {
      "sunday": "sunday",
      "monday": "monday",
      "tuesday": "tuesday",
      "wednesday": "wednesday",
      "thursday": "thursday",
      "friday": "friday",
      "saturday": "saturday"
    }
  }
}
```

## Error Handling

### Validation Errors

When validation fails, the API returns detailed Arabic error messages:

```json
{
  "status": "validationError",
  "message": "أخطاء في التحقق من البيانات",
  "timestamp": "2025-07-21T14:30:00.000Z",
  "errors": [
    "حقل «العنوان» مطلوب",
    "حقل «نوع الحلقة» يجب أن يكون نصًا",
    "«تاريخ البداية» يجب أن يكون تاريخًا بصيغة ISO 8601"
  ]
}
```

### Common Error Responses

#### Not Found (404)

```json
{
  "status": "error",
  "message": "لم يتم العثور على الحلقة",
  "timestamp": "2025-07-21T14:30:00.000Z",
  "data": null
}
```

#### Unauthorized (403)

```json
{
  "status": "error",
  "message": "لم يتم العثور على المعلم",
  "timestamp": "2025-07-21T14:30:00.000Z",
  "data": null
}
```

#### Server Error (500)

```json
{
  "status": "error",
  "message": "خطأ في الخادم",
  "timestamp": "2025-07-21T14:30:00.000Z",
  "data": {
    "error": "Internal server error details"
  }
}
```

### HTTP Status Codes

| Status Code | Arabic Message | Description                    |
| ----------- | -------------- | ------------------------------ |
| 200         | تم بنجاح       | Successful operation           |
| 201         | تم إنشاء بنجاح | Resource created successfully  |
| 400         | طلب غير صحيح   | Bad request / validation error |
| 401         | غير مخول       | Unauthorized                   |
| 403         | ممنوع          | Forbidden                      |
| 404         | غير موجود      | Resource not found             |
| 500         | خطأ في الخادم  | Internal server error          |

## Validation

### Field Validation Rules

| Field              | Rules                                  | Arabic Message                                       |
| ------------------ | -------------------------------------- | ---------------------------------------------------- |
| title              | Required, string                       | حقل «العنوان» مطلوب                                  |
| halqaType          | Required, enum: ["private", "halqa"]   | قيمة «نوع الحلقة» غير صحيحة                          |
| schedule           | Required, object                       | حقل «الجدول» مطلوب                                   |
| schedule.startDate | Required, ISO8601 date                 | «تاريخ البداية» يجب أن يكون تاريخًا بصيغة ISO 8601   |
| schedule.endDate   | Required, ISO8601 date                 | «تاريخ النهاية» يجب أن يكون تاريخًا بصيغة ISO 8601   |
| schedule.days      | Required, array min:1                  | يجب اختيار يوم واحد على الأقل في الجدول              |
| schedule.startTime | Required, HH:mm format                 | «وقت البداية» يجب أن يكون بتنسيق HH:mm               |
| schedule.duration  | Required, positive integer             | «المدة» يجب أن يكون رقمًا صحيحًا موجبًا              |
| curriculum         | Required, enum                         | قيمة «المنهج» غير صحيحة                              |
| maxStudents        | Required for group, positive integer   | «الحد الأقصى للطلاب» يجب أن يكون رقمًا صحيحًا موجبًا |
| student            | Required for private, MongoDB ObjectId | «معرّف الطالب» يجب أن يكون ObjectId صحيحًا           |
| price              | Required for group, positive number    | «السعر» يجب أن يكون رقمًا موجبًا                     |

## Notes

1. **Date Format**: All dates are in ISO 8601 format (UTC)
2. **Authentication**: JWT token required in Authorization header
3. **Localization**: Response messages are in Arabic, data fields are in English
4. **Pagination**: Available on list endpoints with standard pagination parameters
5. **File Uploads**: Profile pictures use relative paths from upload directory
6. **Private Halakat**: Price is automatically managed from teacher profile
7. **Session Extension**: Cancelled sessions automatically extend the schedule
8. **Zoom Integration**: Automatic meeting creation for all Halakat
