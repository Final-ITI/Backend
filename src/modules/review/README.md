# Review Module API

This module allows students to submit reviews for teachers after completing a Halaka (course/session). It also allows fetching all reviews for a specific teacher.

## Endpoints

### 1. إضافة تقييم (Add Review)

- **POST** `/api/v1/reviews`
- **Authorization:** Required (student only)
- **Request Body:**
  ```json
  {
    "halakaId": "HALAKA_OBJECT_ID",
    "rating": 5,
    "reviewText": "شرح رائع"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "created",
    "message": "تم إرسال التقييم بنجاح",
    "data": { ...reviewObject }
  }
  ```
- **Response (Errors):**
  - إذا لم تنتهِ الحلقة بعد:
    ```json
    { "status": "error", "message": "لم تنتهِ الحلقة بعد" }
    ```
  - إذا كان الطالب غير مسجل:
    ```json
    { "status": "error", "message": "أنت لست مسجلاً في هذه الحلقة" }
    ```
  - إذا تم التقييم مسبقاً:
    ```json
    { "status": "error", "message": "لقد قمت بتقييم هذه الحلقة مسبقاً" }
    ```

### 2. جلب تقييمات معلم (Get Teacher Reviews)

- **GET** `/api/v1/reviews/:teacherId`
- **Response:**
  ```json
  {
    "status": "success",
    "message": "تم جلب تقييمات المعلم بنجاح",
    "data": [
      {
        "id": "REVIEW_ID",
        "rating": 5,
        "reviewText": "شرح رائع",
        "createdAt": "2024-06-01T12:00:00.000Z",
        "student": {
          "id": "STUDENT_ID",
          "firstName": "أحمد",
          "lastName": "محمد",
          "profileImage": "..."
        }
      }
    ]
  }
  ```

## Notes for Frontend Developers

- All messages are returned in Arabic.
- Students can only submit a review after the halaka is finished (when `schedule.endDate` is in the past).
- Each student can only review a halaka once.
- Use the `rating` field as an integer from 1 to 5.
- The `reviewText` field is optional.
- To display reviews for a teacher, use the GET endpoint with the teacher's ID.

## Example Usage

**Add Review:**

```js
fetch("/api/v1/reviews", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer STUDENT_TOKEN",
  },
  body: JSON.stringify({
    halakaId: "HALAKA_OBJECT_ID",
    rating: 5,
    reviewText: "شرح رائع",
  }),
});
```

**Get Teacher Reviews:**

```js
fetch("/api/v1/reviews/TEACHER_OBJECT_ID");
```
