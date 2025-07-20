# Halaka API Documentation

This comprehensive documentation covers all endpoints for the Halaka (Quranic Study Circle) management system. The API provides complete CRUD operations for managing Islamic study circles, sessions, attendance, and related functionality.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base Information](#base-information)
4. [Halaka Management](#halaka-management)
5. [Session Management](#session-management)
6. [Attendance Management](#attendance-management)
7. [Student Management](#student-management)
8. [Analytics](#analytics)
9. [Enums and Reference Data](#enums-and-reference-data)
10. [Error Handling](#error-handling)

## Overview

The Halaka API supports two types of study circles:

- **Private (جلسة خاصة)**: One-on-one sessions between teacher and student
- **Group (حلقة جماعية)**: Group sessions with multiple students

All API responses return data in Arabic while maintaining English field names for consistency.

## Authentication

All endpoints require JWT authentication with appropriate role authorization.

**Headers Required:**

```
Authorization: Bearer
Content-Type: application/json
```

**Roles:**

- `teacher`: Required for all Halaka management operations
- Teacher must own the Halaka to perform operations on it

## Base Information

**Base URL:** `/api/v1/halaka`

**Response Format:**
All responses follow a consistent structure:

```json
{
  "status": "success|created|error|validationError",
  "message": "Arabic message",
  "timestamp": "ISO 8601 timestamp",
  "data": "Response data"
}
```

## Halaka Management

### Create Halaka

**POST** `/api/v1/halaka/`

Creates a new Halaka. For private sessions, the price is automatically set from teacher's profile.

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

#### Schedule Object Structure

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
  "title": "حلقة حفظ جزء عم",
  "description": "للمبتدئين في حفظ القرآن",
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
  "curriculum": "quran_memorization",
  "maxStudents": 15,
  "price": 150
}
```

#### Success Response

```json
{
  "status": "created",
  "message": "تم إنشاء الحلقة بنجاح",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    "_id": "60f1234567890abcdef12345",
    "title": "حلقة حفظ جزء عم",
    "description": "للمبتدئين في حفظ القرآن",
    "halqaType": "حلقة جماعية",
    "status": "مجدولة",
    "curriculum": "حفظ القرآن",
    "schedule": {
      "frequency": "weekly",
      "days": ["الأحد", "الثلاثاء"],
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": [
    {
      "id": "60f1234567890abcdef12345",
      "title": "حلقة التجويد المتقدم",
      "description": "تعلم أحكام التجويد",
      "teacher": {
        "name": "أ. محمد أحمد",
        "rating": 4.8,
        "studentsCount": 45,
        "profileImage": "/uploads/teachers/teacher1.jpg"
      },
      "curriculum": "تجويد",
      "price": 120,
      "currency": "ج.م",
      "maxStudents": 20,
      "currentStudents": 12,
      "schedule": {
        "days": ["الاثنين", "الأربعاء"],
        "startTime": "19:00",
        "duration": 60,
        "frequency": "weekly"
      },
      "nextSession": "الاثنين - 19:00",
      "location": "أونلاين",
      "status": "نشطة",
      "halqaType": "حلقة جماعية"
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    "_id": "60f1234567890abcdef12345",
    "title": "حلقة حفظ سورة البقرة",
    "description": "حفظ وتدبر سورة البقرة",
    "halqaType": "حلقة جماعية",
    "status": "نشطة",
    "curriculum": "حفظ القرآن",
    "schedule": {
      "frequency": "weekly",
      "days": ["السبت", "الثلاثاء"],
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
  "title": "حلقة محدثة",
  "status": "نشطة",
  "maxStudents": 25
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "تم تحديث الحلقة بنجاح",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    // Updated halaka object with Arabic translations
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": null
}
```

### Get Teacher's Halakat

**GET** `/api/v1/halaka/teacher/:teacherId`

Retrieves all Halakat belonging to the authenticated teacher.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الحلقات بنجاح",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": [
    {
      // Array of teacher's Halakat with Arabic translations
    }
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
  "timestamp": "2025-07-20T21:30:00.000Z",
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
      "status": "قادمة"
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
  "reason": "إجازة طارئة"
}
```

#### Success Response

```json
{
  "status": "success",
  "message": "تم إلغاء الجلسة وتحديث الجدول بنجاح",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    "cancelledSession": {
      "sessionDate": "2025-08-15T00:00:00.000Z",
      "reason": "إجازة طارئة"
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    "halaka": {
      "id": "60f1234567890abcdef12345",
      "title": "حلقة القرآن"
    },
    "cancelledSessions": [
      {
        "sessionDate": "2025-08-15T00:00:00.000Z",
        "cancelledAt": "2025-08-10T15:30:00.000Z",
        "reason": "إجازة طارئة",
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
  "timestamp": "2025-07-20T21:30:00.000Z",
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": [
    {
      "sessionDate": "2025-08-01T00:00:00.000Z",
      "records": [
        {
          "student": {
            "id": "60f9876543210abcdef67890",
            "firstName": "عمر",
            "lastName": "محمد",
            "email": "omar@example.com",
            "profilePicture": "/uploads/students/omar.jpg"
          },
          "status": "حاضر",
          "timeIn": "2025-08-01T19:00:00.000Z",
          "timeOut": "2025-08-01T20:30:00.000Z"
        },
        {
          "student": {
            "id": "60f9876543210abcdef67891",
            "firstName": "فاطمة",
            "lastName": "أحمد",
            "email": "fatima@example.com",
            "profilePicture": "/uploads/students/fatima.jpg"
          },
          "status": "متأخر",
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": [
    {
      "id": "60f9876543210abcdef67890",
      "firstName": "عمر",
      "lastName": "محمد",
      "email": "omar@example.com",
      "profilePicture": "/uploads/students/omar.jpg"
    },
    {
      "id": "60f9876543210abcdef67891",
      "firstName": "فاطمة",
      "lastName": "أحمد",
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
  "timestamp": "2025-07-20T21:30:00.000Z",
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

## Enums and Reference Data

### Get Available Enums

**GET** `/api/v1/halaka/enums`

Returns all available enum values in Arabic for frontend dropdowns.

#### Success Response

```json
{
  "status": "success",
  "message": "تم جلب الخيارات المتاحة بنجاح",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": {
    "halqaType": {
      "halqa": "حلقة جماعية",
      "private": "جلسة خاصة"
    },
    "status": {
      "scheduled": "مجدولة",
      "active": "نشطة",
      "completed": "مكتملة",
      "cancelled": "ملغاة"
    },
    "curriculum": {
      "quran_memorization": "حفظ القرآن",
      "tajweed": "تجويد",
      "arabic": "العربية",
      "islamic_studies": "دراسات إسلامية"
    },
    "sessionStatus": {
      "present": "حاضر",
      "absent": "غائب",
      "late": "متأخر",
      "excused": "معذور"
    },
    "days": {
      "sunday": "الأحد",
      "monday": "الاثنين",
      "tuesday": "الثلاثاء",
      "wednesday": "الأربعاء",
      "thursday": "الخميس",
      "friday": "الجمعة",
      "saturday": "السبت"
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
  "timestamp": "2025-07-20T21:30:00.000Z",
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
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": null
}
```

#### Unauthorized (403)

```json
{
  "status": "error",
  "message": "لم يتم العثور على المعلم",
  "timestamp": "2025-07-20T21:30:00.000Z",
  "data": null
}
```

#### Server Error (500)

```json
{
  "status": "error",
  "message": "خطأ في الخادم",
  "timestamp": "2025-07-20T21:30:00.000Z",
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

## Notes

1. **Date Format**: All dates are in ISO 8601 format (UTC)
2. **Authentication**: JWT token required in Authorization header
3. **Localization**: All enum values and messages are returned in Arabic
4. **Pagination**: Available on list endpoints with standard pagination parameters
5. **File Uploads**: Profile pictures and attachments use relative paths from upload directory
6. **Private Halakat**: Price is automatically managed from teacher profile
7. **Session Extension**: Cancelled sessions automatically extend the schedule
8. **Zoom Integration**: Automatic meeting creation for all Halakat
