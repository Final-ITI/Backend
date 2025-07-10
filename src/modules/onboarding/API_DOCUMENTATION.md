# Onboarding Module API Documentation

## Overview

The Onboarding module handles teacher profile setup and document upload for verification. All endpoints require authentication with a valid JWT token and teacher role authorization.

**Base URL**: `/api/onboarding`

---

## Authentication

All requests must include the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Required Role**: `teacher`

---

## Endpoints

### 1. Update Teacher Profile

**PUT** `/profile`

Updates the teacher's professional profile information.

#### Request Body

```json
{
  "specialization": "quran_memorization",
  "bio": "Experienced Quran teacher with 10 years of teaching experience",
  "skills": "Tajweed, Memorization, Recitation",
  "experience": 10,
  "sessionPrice": 50.0,
  "id_number": "12345678901234"
}
```

#### Validation Rules

| Field            | Type    | Required | Validation                                                                                                          |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `specialization` | string  | Yes      | Must be one of: `quran_memorization`, `quran_recitation`, `tajweed`, `arabic_language`, `fiqh`, `hadith`, `aqeedah` |
| `bio`            | string  | Yes      | Max 500 characters                                                                                                  |
| `skills`         | string  | Yes      | Max 200 characters                                                                                                  |
| `experience`     | integer | Yes      | 0-50 years                                                                                                          |
| `sessionPrice`   | number  | Yes      | Minimum 1                                                                                                           |
| `id_number`      | string  | Yes      | Exactly 14 characters                                                                                               |

#### Response

```json
{
  "status": "success",
  "message": "Profile updated successfully.",
  "data": {
    "_id": "teacher_id",
    "specialization": "quran_memorization",
    "bio": "Experienced Quran teacher with 10 years of teaching experience",
    "skills": "Tajweed, Memorization, Recitation",
    "experience": 10,
    "sessionPrice": 50,
    "id_number": "12345678901234",
    "real_gender": "male",
    "userId": "user_id"
  }
}
```

---

### 2. Upload Document

**POST** `/documents`

Uploads a verification document for the teacher.

#### Request

- **Content-Type**: `multipart/form-data`
- **File Field**: `document` (required)
- **Form Fields**: `docType` (required)

#### Document Types

| Value                 | Description                |
| --------------------- | -------------------------- |
| `national_id_front`   | Front side of national ID  |
| `national_id_back`    | Back side of national ID   |
| `birth_certificate`   | Birth certificate          |
| `guardian_id`         | Guardian's ID (for minors) |
| `teacher_certificate` | Teaching certificate       |
| `other`               | Other supporting documents |

#### Supported File Types

- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF
- **Size**: Recommended under 10MB

#### Example Request

```javascript
const formData = new FormData();
formData.append("document", file);
formData.append("docType", "national_id_front");

fetch("/api/onboarding/documents", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
  },
  body: formData,
});
```

#### Response

```json
{
  "status": "success",
  "message": "Document uploaded successfully.",
  "data": {
    "_id": "document_id",
    "ownerType": "teacher",
    "ownerId": "teacher_id",
    "docType": "national_id_front",
    "fileUrl": "https://cloudinary.com/secure_url",
    "publicId": "cloudinary_public_id",
    "fileHash": "etag_hash",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Delete Document

**DELETE** `/documents/:docId`

Deletes a previously uploaded document.

#### Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `docId`   | string | Yes      | Valid MongoDB ObjectId |

#### Example Request

```javascript
fetch(`/api/onboarding/documents/${documentId}`, {
  method: "DELETE",
  headers: {
    Authorization: "Bearer " + token,
  },
});
```

#### Response

```json
{
  "status": "success",
  "message": "Document deleted successfully.",
  "data": null
}
```

---

## Error Responses

### Common HTTP Status Codes

- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **500** - Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    {
      "field": "specialization",
      "message": "Specialization is required."
    }
  ]
}
```

---

## Frontend Integration Examples

### Complete Profile Update

```javascript
const updateTeacherProfile = async (profileData) => {
  try {
    const response = await fetch("/api/onboarding/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (result.status === "success") {
      console.log("Profile updated successfully");
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
};
```

### Document Upload with Progress

```javascript
const uploadDocument = async (file, docType, onProgress) => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("docType", docType);

  try {
    const response = await fetch("/api/onboarding/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.status === "success") {
      console.log("Document uploaded successfully");
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Document upload failed:", error);
    throw error;
  }
};
```

---

## Notes

- All documents start with "pending" status and require admin review
- Files are stored in Cloudinary with automatic optimization
- Gender is automatically determined from the ID number (odd = male, even = female)
- Only document owners can delete their own documents
- All inputs are sanitized and validated before processing
