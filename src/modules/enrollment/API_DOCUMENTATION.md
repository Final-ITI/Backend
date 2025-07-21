# Enrollment Module API Documentation

## Overview

The Enrollment module provides endpoints for students to enroll in group halakas (classes) on the platform. This module handles the first step of a two-step enrollment process: 1) Enrollment reservation, and 2) Payment processing.

**Base URL**: `/api/v1/enrollments`

---

## Authentication

All requests must include the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Required Role**: `student`

---

## Endpoints

### 1. Enroll in Group Halaka

**POST** `/group`

Reserves a spot for a student in a group halaka and prepares for the payment process. This endpoint is specifically designed for group halakas only.

#### Request Body

| Parameter | Type   | Required | Description                    | Validation             |
| --------- | ------ | -------- | ------------------------------ | ---------------------- |
| `id`      | string | Yes      | ID of the group halaka to join | Valid MongoDB ObjectId |

#### Example Request

```javascript
fetch("/api/v1/enrollments/group", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "507f1f77bcf86cd799439011",
  }),
});
```

#### Success Response

```json
{
  "status": "success",
  "message": "Enrollment initiated. Please proceed to payment.",
  "timestamp": "2024-06-01T12:00:00.000Z",
  "data": {
    "enrollmentId": "507f1f77bcf86cd799439012",
    "amount": 150,
    "currency": "EGP",
    "description": "Enrollment in: Advanced Tajweed Course"
  }
}
```

#### Business Rules

1. **Group Halaka Only**: This endpoint only accepts enrollments for halakas with `halqaType: "halqa"`. Private halakas are handled by separate endpoints.
2. **Availability Check**: The system verifies that the halaka is not full by comparing `currentStudents` with `maxStudents`.
3. **No Duplicate Enrollments**: The system prevents duplicate enrollments by checking if the student already has an enrollment record for this halaka.
4. **Student Profile Required**: The authenticated user must have a valid student profile.
5. **Pre-save Validation**: All business logic validation is handled automatically by the enrollment schema's pre-save hook.

#### Error Responses

| Status Code | Error Type           | Description                                        |
| ----------- | -------------------- | -------------------------------------------------- |
| 400         | Bad Request          | Invalid halaka ID format                           |
| 400         | Group Halaka Only    | Attempted to enroll in a private halaka            |
| 400         | Halaka Full          | The halaka has reached maximum capacity            |
| 400         | Duplicate Enrollment | Student already enrolled or has pending enrollment |
| 401         | Unauthorized         | Missing or invalid authentication token            |
| 403         | Forbidden            | User does not have student role                    |
| 404         | Not Found            | Halaka not found or student profile not found      |

#### Example Error Response

```json
{
  "status": "error",
  "message": "This halaka is full.",
  "timestamp": "2024-06-01T12:00:00.000Z"
}
```

---

## New: Private Halaka Invitation Endpoints

### 2. List All Pending Invitations

**GET** `/invitations`

Fetch all pending private halaka invitations for the authenticated student.

#### Query Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `page`    | number | No       | Page number (default: 1)       |
| `limit`   | number | No       | Results per page (default: 10) |

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "enrollment_id_123",
      "status": "pending_action",
      "snapshot": {
        "halakaTitle": "Beginner Tajweed Course",
        "totalPrice": 200,
        "currency": "EGP"
      },
      "halakaDetails": {
        "_id": "halaka_id_abc",
        "title": "Beginner Tajweed Course",
        "schedule": {
          /* schedule details */
        }
      },
      "teacherDetails": {
        "name": "Ahmed Mahmoud",
        "avatar": "url_to_image.jpg"
      }
    }
  ],
  "total": 1,
  "message": "تم استرجاع الدعوات المعلقة بنجاح."
}
```

#### Business Rules

- Only invitations with status `pending_action` are returned.
- Only invitations for the authenticated student are returned.
- Populates halaka and teacher details.

---

### 3. Get Single Invitation Details

**GET** `/invitations/:id`

Fetch the details of a single invitation for the authenticated student.

#### URL Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `id`      | string | Yes      | Enrollment document ID |

#### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "the_specific_enrollment_id",
    "status": "pending_action",
    "snapshot": {
      "halakaTitle": "Advanced Tajweed Course",
      "totalPrice": 250,
      "currency": "EGP"
    },
    "halakaDetails": {
      "_id": "halaka_id_abc",
      "title": "Advanced Tajweed Course",
      "description": "A course for advanced students.",
      "schedule": {
        /* full schedule object */
      }
    },
    "teacherDetails": {
      "name": "Fatima Ali",
      "avatar": "url_to_image.jpg",
      "bio": "Experienced Quran teacher..."
    }
  }
}
```

#### Business Rules

- Only the student who owns the invitation can access it.
- Returns 404 if not found or not owned by the student.
- Populates halaka and teacher details.

---

### 4. Accept or Reject an Invitation

**PATCH** `/invitations/:id`

Accept or reject a specific invitation.

#### URL Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `id`      | string | Yes      | Enrollment document ID |

#### Request Body

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `action`  | string | Yes      | "accept" or "reject" |

#### Example Request (Accept)

```json
{
  "action": "accept"
}
```

#### Example Request (Reject)

```json
{
  "action": "reject"
}
```

#### Success Response (Accept)

```json
{
  "success": true,
  "message": "Invitation accepted. Please proceed to payment.",
  "data": {
    "_id": "the_specific_enrollment_id",
    "status": "pending_payment"
  }
}
```

#### Success Response (Reject)

```json
{
  "success": true,
  "message": "Invitation has been successfully rejected."
}
```

#### Business Rules

- Only the student who owns the invitation can act on it.
- Only invitations with status `pending_action` can be updated.
- Accept: status changes to `pending_payment`.
- Reject: status changes to `cancelled_by_student` and notifies the teacher.
- Returns 404 if not found or not owned by the student.

---

## Enrollment Status Flow

After successful enrollment creation, the enrollment record will have:

- **Status**: `pending_payment`
- **sessionsRemaining**: `0` (will be set after payment)

The enrollment process follows this flow:

1. **Enrollment Creation** (this endpoint) → `pending_payment`
2. **Payment Processing** (separate endpoint) → `active`
3. **Session Management** → `no_balance` (when sessions run out)
4. **Completion** → `completed` (when halaka ends)

---

## Validation Details

### Input Validation (Express-Validator)

The endpoint uses express-validator for input validation:

```javascript
// Validation rules
body("id")
  .notEmpty()
  .withMessage("Halaka ID is required.")
  .isString()
  .withMessage("Halaka ID must be a string.")
  .custom((value) => {
    return mongoose.Types.ObjectId.isValid(value);
  })
  .withMessage("Invalid Halaka ID format.")
  .trim()
  .escape();
```

### Business Logic Validation (Pre-save Hook)

The enrollment schema includes a pre-save hook that automatically validates:

1. **Duplicate Check**: Ensures no existing enrollment for the same student-halaka combination
2. **Halaka Existence**: Verifies the halaka exists in the database
3. **Group Type Validation**: Confirms the halaka is of type "halqa"
4. **Capacity Check**: Ensures the halaka is not full

---

## Frontend Integration Examples

### Enroll in Group Halaka

```javascript
const enrollInGroupHalaka = async (halakaId) => {
  try {
    const response = await fetch("/api/v1/enrollments/group", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: halakaId }),
    });

    const result = await response.json();

    if (result.status === "success") {
      // Proceed to payment with the enrollment data
      const { enrollmentId, amount, currency, description } = result.data;
      console.log("Enrollment created:", enrollmentId);
      console.log("Payment required:", amount, currency);

      // Redirect to payment page or show payment modal
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Enrollment failed:", error);
    throw error;
  }
};

// Usage
try {
  const paymentDetails = await enrollInGroupHalaka("halaka_id_here");
  // Handle payment flow
} catch (error) {
  // Handle error (show user-friendly message)
  if (error.message.includes("full")) {
    alert("This halaka is full. Please try another one.");
  } else if (error.message.includes("already enrolled")) {
    alert("You are already enrolled in this halaka.");
  }
}
```

### Error Handling

```javascript
const handleEnrollmentError = (error) => {
  const errorMessages = {
    "This halaka is full.": "This class is full. Please try another one.",
    "You are already enrolled in this halaka.":
      "You are already enrolled in this class.",
    "This enrollment process is for group halaqas only.":
      "This enrollment is for group classes only.",
    "Student profile not found": "Please complete your student profile first.",
  };

  return errorMessages[error.message] || "Enrollment failed. Please try again.";
};
```

---

## Notes

- This endpoint is specifically designed for group halakas only
- The enrollment is created with `pending_payment` status, indicating the student has reserved a spot but hasn't paid yet
- The response includes payment information needed for the next step in the enrollment process
- All business validations are performed automatically by the enrollment schema's pre-save hook
- The endpoint uses proper authentication and authorization middleware
- Input validation is performed using express-validator
- The enrollment schema automatically handles duplicate prevention and capacity checks
- Error messages are user-friendly and provide clear guidance on next steps
