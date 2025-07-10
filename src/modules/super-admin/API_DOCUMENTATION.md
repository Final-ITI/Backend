# Super Admin Module API Documentation

## Overview

The Super Admin module provides administrative functionality for managing teacher verification requests. All endpoints require authentication with a valid JWT token and superadmin role authorization.

**Base URL**: `/api/super-admin/verifications`

---

## Authentication

All requests must include the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Required Role**: `superadmin`

---

## Endpoints

### 1. Get Verification Requests

**GET** `/`

Retrieves a paginated list of teacher verification requests with filtering and search capabilities.

#### Query Parameters

| Parameter            | Type    | Required | Description                            | Validation                        |
| -------------------- | ------- | -------- | -------------------------------------- | --------------------------------- |
| `page`               | integer | No       | Page number for pagination             | Min: 1, Default: 1                |
| `verificationStatus` | string  | No       | Filter by verification status          | `pending`, `approved`, `rejected` |
| `q`                  | string  | No       | Search query for teacher name or email | 2-100 characters                  |

#### Example Requests

```javascript
// Get pending verification requests
fetch("/api/super-admin/verifications?verificationStatus=pending&page=1", {
  headers: { Authorization: "Bearer " + token },
});

// Search for specific teacher
fetch("/api/super-admin/verifications?q=ahmed&verificationStatus=pending", {
  headers: { Authorization: "Bearer " + token },
});

// Get all approved teachers
fetch("/api/super-admin/verifications?verificationStatus=approved", {
  headers: { Authorization: "Bearer " + token },
});
```

#### Response

```json
{
  "status": "success",
  "message": "تم جلب طلبات التحقق بنجاح.",
  "data": {
    "teachers": [
      {
        "_id": "teacher_id",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "verificationStatus": "pending",
        "userId": {
          "_id": "user_id",
          "firstName": "Ahmed",
          "lastName": "Mohammed",
          "email": "ahmed@example.com",
          "profilePicture": "https://example.com/avatar.jpg",
          "userType": "teacher"
        },
        "documents": [
          {
            "_id": "document_id",
            "docType": "national_id_front",
            "fileUrl": "https://cloudinary.com/secure_url",
            "status": "pending"
          }
        ]
      }
    ],
    "metadata": {
      "totalPending": 25,
      "approvedThisWeek": 12,
      "rejectedThisWeek": 3,
      "currentPage": 1,
      "totalPages": 3,
      "totalTeachers": 25
    }
  }
}
```

---

### 2. Get Teacher Verification Details

**GET** `/:teacherId`

Retrieves detailed information about a specific teacher's verification request.

#### Parameters

| Parameter   | Type   | Required | Description            |
| ----------- | ------ | -------- | ---------------------- |
| `teacherId` | string | Yes      | Valid MongoDB ObjectId |

#### Example Request

```javascript
fetch("/api/super-admin/verifications/507f1f77bcf86cd799439011", {
  headers: { Authorization: "Bearer " + token },
});
```

#### Response

```json
{
  "status": "success",
  "message": "تم جلب تفاصيل التحقق من المعلم بنجاح.",
  "data": {
    "_id": "teacher_id",
    "verificationStatus": "pending",
    "user": {
      "name": "Ahmed Mohammed",
      "email": "ahmed@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "profile": {
      "experience": 5,
      "bio": "Experienced Quran teacher with 5 years of teaching experience",
      "skills": ["Tajweed", "Memorization", "Recitation"],
      "specialization": "quran_memorization",
      "sessionPrice": 50,
      "currency": "EGP",
      "idNumber": "12345678901234"
    },
    "documents": [
      {
        "_id": "document_id",
        "docType": "National Id Front",
        "status": "pending",
        "fileUrl": "https://cloudinary.com/secure_url",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Review Individual Document

**POST** `/documents/:documentId/review`

Reviews and approves or rejects a specific document submitted by a teacher.

#### Parameters

| Parameter    | Type   | Required | Description            |
| ------------ | ------ | -------- | ---------------------- |
| `documentId` | string | Yes      | Valid MongoDB ObjectId |

#### Request Body

```json
{
  "action": "approve"
}
```

#### Validation Rules

| Field    | Type   | Required | Validation                           |
| -------- | ------ | -------- | ------------------------------------ |
| `action` | string | Yes      | Must be either `approve` or `reject` |

#### Example Request

```javascript
fetch(
  "/api/super-admin/verifications/documents/507f1f77bcf86cd799439011/review",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "approve" }),
  }
);
```

#### Response

```json
{
  "status": "success",
  "message": "تمت الموافقة على المستند بنجاح.",
  "data": {
    "_id": "document_id",
    "status": "approved",
    "reviewDate": "2024-01-01T12:00:00.000Z",
    "reviewer": "superadmin_id"
  }
}
```

---

### 4. Update Teacher Verification Status

**PATCH** `/:teacherId/status`

Approves or rejects all documents for a teacher and updates their overall verification status.

#### Parameters

| Parameter   | Type   | Required | Description            |
| ----------- | ------ | -------- | ---------------------- |
| `teacherId` | string | Yes      | Valid MongoDB ObjectId |

#### Request Body

```json
{
  "action": "approve"
}
```

#### Validation Rules

| Field    | Type   | Required | Validation                           |
| -------- | ------ | -------- | ------------------------------------ |
| `action` | string | Yes      | Must be either `approve` or `reject` |

#### Example Request

```javascript
fetch("/api/super-admin/verifications/507f1f77bcf86cd799439011/status", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ action: "approve" }),
});
```

#### Response

```json
{
  "status": "success",
  "message": "تمت الموافقة على جميع مستندات المعلم بنجاح.",
  "data": {
    "teacherId": "teacher_id",
    "verificationStatus": "approved"
  }
}
```

---

## Error Responses

### Common HTTP Status Codes

- **400** - Bad Request (invalid action or document/teacher not in pending status)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (teacher or document not found)
- **500** - Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "message": "الإجراء غير صالح، يجب أن يكون 'approve' أو 'reject'",
  "statusCode": 400
}
```

---

## Frontend Integration Examples

### Get Verification Requests with Filtering

```javascript
const getVerificationRequests = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page);
  if (filters.verificationStatus)
    params.append("verificationStatus", filters.verificationStatus);
  if (filters.search) params.append("q", filters.search);

  try {
    const response = await fetch(`/api/super-admin/verifications?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (result.status === "success") {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Failed to fetch verification requests:", error);
    throw error;
  }
};

// Usage
const pendingRequests = await getVerificationRequests({
  verificationStatus: "pending",
  page: 1,
});
```

### Review Document

```javascript
const reviewDocument = async (documentId, action) => {
  try {
    const response = await fetch(
      `/api/super-admin/verifications/documents/${documentId}/review`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      console.log("Document reviewed successfully");
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Document review failed:", error);
    throw error;
  }
};

// Usage
await reviewDocument("document_id", "approve");
```

### Approve All Teacher Documents

```javascript
const approveTeacher = async (teacherId) => {
  try {
    const response = await fetch(
      `/api/super-admin/verifications/${teacherId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      console.log("Teacher approved successfully");
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Teacher approval failed:", error);
    throw error;
  }
};
```

### Bulk Operations

```javascript
const processBulkApprovals = async (teacherIds) => {
  const results = [];

  for (const teacherId of teacherIds) {
    try {
      const result = await approveTeacher(teacherId);
      results.push({ teacherId, status: "success", data: result });
    } catch (error) {
      results.push({ teacherId, status: "error", error: error.message });
    }
  }

  return results;
};
```

---

## Statistics and Analytics

The verification requests endpoint provides useful statistics in the `metadata` object:

- **totalPending**: Total number of pending verification requests
- **approvedThisWeek**: Number of teachers approved in the last 7 days
- **rejectedThisWeek**: Number of teachers rejected in the last 7 days
- **currentPage**: Current page number for pagination
- **totalPages**: Total number of pages available
- **totalTeachers**: Total number of teachers matching the current filter

---

## Notes

- Only documents with "pending" status can be reviewed
- Only teachers with "pending" verification status can be updated
- All review actions are logged with reviewer ID and timestamp
- Document types are formatted for display (underscores replaced with spaces, title case)
- Skills are returned as an array in teacher details
- Search works on teacher's full name (firstName + lastName) and email
- Results are paginated with 10 items per page by default
