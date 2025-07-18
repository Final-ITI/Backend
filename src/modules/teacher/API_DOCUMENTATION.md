# Teacher Module API Documentation

## Overview

The Teacher module provides endpoints for students to browse and search for freelance Quran teachers on the platform. It supports advanced filtering, search, and pagination.

**Base URL**: `/api/v1/teacher`

---

## Endpoints

### 1. Browse Freelance Teachers

**GET** `/`

Retrieves a paginated list of verified freelance teachers with advanced filtering and search capabilities.

#### Query Parameters

| Parameter        | Type    | Required | Description                                                                 | Example Value                |
| ---------------- | ------- | -------- | --------------------------------------------------------------------------- | ---------------------------- |
| `q`              | string  | No       | Search by teacher's first or last name                                      | `ahmed`                      |
| `specialization` | string  | No       | Comma-separated list of specializations (at least one must match)           | `tajweed,quran_memorization` |
| `rating`         | number  | No       | Minimum average rating (inclusive)                                          | `4`                          |
| `minPrice`       | number  | No       | Minimum session price (inclusive)                                           | `50`                         |
| `maxPrice`       | number  | No       | Maximum session price (inclusive)                                           | `200`                        |
| `gender`         | string  | No       | Filter by teacher's gender (from User model)                                | `female`                     |
| `country`        | string  | No       | Filter by teacher's country (from User model)                               | `Egypt`                      |
| `halqaType`      | string  | No       | Only teachers who have at least one Halaka of this type (`private`/`halqa`) | `halqa`                      |
| `page`           | integer | No       | Page number for pagination                                                  | `1`                          |
| `limit`          | integer | No       | Number of results per page                                                  | `10`                         |

#### Example Requests

```javascript
// Basic browse
fetch("/api/v1/teacher?page=1&limit=10");

// Search by name and specialization
fetch("/api/v1/teacher?q=ahmed&specialization=tajweed");

// Filter by rating and price range
fetch("/api/v1/teacher?rating=4&minPrice=50&maxPrice=150");

// Filter by gender and halqaType
fetch("/api/v1/teacher?gender=female&halqaType=halqa");
```

#### Example Response

```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "timestamp": "2024-06-01T12:00:00.000Z",
  "data": {
    "teachers": [
      {
        "_id": "teacher_id",
        "userId": "user_id",
        "specialization": ["tajweed", "quran_memorization"],
        "sessionPrice": "100",
        "currency": "EGP",
        "performance": {
          "rating": 4.8,
          "totalRatings": 25
        },
        "bio": "Experienced Quran teacher...",
        "isVerified": true,
        "user": {
          "_id": "user_id",
          "firstName": "Ahmed",
          "lastName": "Mohammed",
          "email": "ahmed@example.com",
          "gender": "male",
          "country": "Egypt",
          "profilePicture": "https://example.com/avatar.jpg"
        }
      }
    ],
    "count": 1,
    "filters": {
      "q": "ahmed",
      "specialization": "tajweed",
      "rating": 4
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNext": false,
    "hasPrev": false,
    "count": 1,
    "filteredCount": 1
  }
}
```

---

## Notes

- All filters are optional; results are always paginated.
- The `halqaType` filter requires the teacher to have at least one Halaka of the specified type (`private` or `halqa`).
- The `specialization` filter matches if the teacher has at least one of the provided specializations.
- The `sessionPrice` is stored as a string but filtered numerically.
- The `performance.rating` is the average rating for the teacher.
- The `filters` object in the response echoes the applied filters.
- The `pagination` object provides metadata for frontend pagination controls.

---

## Error Responses

### Common HTTP Status Codes

- **400** - Bad Request (invalid query parameters)
- **404** - Not Found (no teachers match the filters)
- **500** - Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "message": "Invalid query parameter: rating must be a number",
  "statusCode": 400
}
```
