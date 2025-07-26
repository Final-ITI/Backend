# Wallet API Documentation

## Overview

The Wallet API provides endpoints for teachers to manage their wallet balance, payout requests, and banking information. It also includes super admin endpoints for managing payout requests.

## Authentication

All endpoints require authentication with a Bearer token and appropriate role authorization (teacher or superadmin).

## Teacher Endpoints

### 1. Get Wallet Balance

**GET** `/api/v1/wallet/my-balance`

Get the current wallet balance for the authenticated teacher.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "message": "تم جلب رصيد المحفظة بنجاح",
  "data": {
    "wallet": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "teacher": "64f8a1b2c3d4e5f6a7b8c9d1",
      "balance": 1500.5,
      "pendingBalance": 0,
      "payoutsPending": 0,
      "currency": "EGP",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "user": {
      "firstName": "Ahmed",
      "lastName": "Mohamed",
      "profilePicture": "https://example.com/profile.jpg"
    }
  }
}
```

### 2. Get Banking Information

**GET** `/api/v1/wallet/banking-info`

Get the teacher's saved banking information.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "message": "تم جلب معلومات البنك بنجاح",
  "data": {
    "bankName": "Commercial International Bank",
    "accountHolderName": "Ahmed Mohamed",
    "accountNumber": "1234567890123456",
    "iban": "EG123456789012345678901234",
    "swiftCode": "CIBEEGCX",
    "isVerified": false
  }
}
```

### 3. Update Banking Information

**PUT** `/api/v1/wallet/banking-info`

Update the teacher's banking information.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "bankName": "Commercial International Bank",
  "accountHolderName": "Ahmed Mohamed",
  "accountNumber": "1234567890123456",
  "iban": "EG123456789012345678901234",
  "swiftCode": "CIBEEGCX"
}
```

**Validation Rules:**

- `bankName`: Required, 2-100 characters, letters, Arabic text, spaces, hyphens, dots
- `accountHolderName`: Required, 2-100 characters, letters, Arabic text, spaces, hyphens, dots
- `accountNumber`: Required, exactly 16 digits
- `iban`: Optional, valid IBAN format (2 letters + 2 digits + 1-30 alphanumeric)
- `swiftCode`: Optional, 8 or 11 characters, letters and numbers

**Response:**

```json
{
  "status": "success",
  "message": "Banking information updated successfully",
  "data": {
    "bankName": "Commercial International Bank",
    "accountHolderName": "Ahmed Mohamed",
    "accountNumber": "1234567890123456",
    "iban": "EG123456789012345678901234",
    "swiftCode": "CIBEEGCX",
    "isVerified": false
  }
}
```

### 4. Create Payout Request

**POST** `/api/v1/wallet/payout-requests`

Create a new payout request to withdraw funds from the wallet.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 500
}
```

**Validation Rules:**

- `amount`: Required, minimum 200 EGP, must not exceed available balance

**Response:**

```json
{
  "status": "success",
  "message": "تم تقديم طلب السحب بنجاح",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "teacher": "64f8a1b2c3d4e5f6a7b8c9d1",
    "amount": 500,
    "status": "pending",
    "bankingInfo": {
      "bankName": "Commercial International Bank",
      "accountHolderName": "Ahmed Mohamed",
      "accountNumber": "1234567890123456",
      "iban": "EG123456789012345678901234",
      "swiftCode": "CIBEEGCX",
      "isVerified": false
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Get Payout Requests History

**GET** `/api/v1/wallet/payout-requests`

Get the history of payout requests for the authenticated teacher.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, approved, rejected, completed)

**Example:**

```
GET /api/v1/wallet/payout-requests?page=1&limit=5&status=pending
```

**Response:**

```json
{
  "status": "success",
  "message": "تم جلب طلبات السحب بنجاح",
  "data": {
    "payoutRequests": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "teacher": "64f8a1b2c3d4e5f6a7b8c9d1",
        "amount": 500,
        "status": "pending",
        "bankingInfo": {
          "bankName": "Commercial International Bank",
          "accountHolderName": "Ahmed Mohamed",
          "accountNumber": "1234567890123456",
          "iban": "EG123456789012345678901234",
          "swiftCode": "CIBEEGCX",
          "isVerified": false
        },
        "processedBy": null,
        "adminNotes": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

## Super Admin Endpoints

### 6. Get All Payout Requests (Admin)

**GET** `/api/v1/wallet/admin/payout-requests`

Get all payout requests for admin review and management.

**Headers:**

```
Authorization: Bearer <token>
```

**Access:** Super Admin only

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, approved, rejected, completed)

**Example:**

```
GET /api/v1/wallet/admin/payout-requests?page=1&limit=10&status=pending
```

**Response:**

```json
{
  "status": "success",
  "message": "تم جلب طلبات السحب بنجاح",
  "data": {
    "payoutRequests": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "amount": 500,
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "teacher": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "fullName": "Ahmed Mohamed",
          "email": "ahmed@example.com",
          "bankingInfo": {
            "bankName": "Commercial International Bank",
            "accountHolderName": "Ahmed Mohamed",
            "accountNumber": "1234567890123456",
            "iban": "EG123456789012345678901234",
            "swiftCode": "CIBEEGCX",
            "isVerified": false
          }
        },
        "processedBy": null,
        "adminNotes": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 7. Update Payout Request Status (Admin)

**PATCH** `/api/v1/wallet/admin/payout-requests/:id`

Approve or reject a payout request.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Access:** Super Admin only

**URL Parameters:**

- `id`: Payout request ID

**Request Body:**

```json
{
  "action": "approved",
  "adminNotes": "Payment processed successfully"
}
```

**For Rejection:**

```json
{
  "action": "rejected",
  "adminNotes": "Insufficient documentation provided",
  "rejectionReason": "Please provide additional verification documents"
}
```

**Validation Rules:**

- `action`: Required, must be "approved" or "rejected"
- `adminNotes`: Optional, max 500 characters
- `rejectionReason`: Required when action is "rejected", 10-200 characters

**Response:**

```json
{
  "status": "success",
  "message": "تم الموافقة طلب السحب بنجاح",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "teacher": "64f8a1b2c3d4e5f6a7b8c9d1",
    "amount": 500,
    "status": "completed",
    "processedBy": "64f8a1b2c3d4e5f6a7b8c9d2",
    "adminNotes": "Payment processed successfully",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

## Error Responses

### Validation Error (400)

```json
{
  "status": "fail",
  "message": "Validation failed",
  "errors": {
    "amount": "المبلغ مطلوب",
    "bankName": "اسم البنك مطلوب",
    "accountNumber": "رقم الحساب يجب أن يكون 16 رقم بالضبط"
  }
}
```

### Business Logic Error (400)

```json
{
  "status": "error",
  "message": "من فضلك أضف معلومات البنك الخاصة بك في إعدادات الملف الشخصي قبل طلب السحب."
}
```

```json
{
  "status": "error",
  "message": "الحد الأدنى لمبلغ السحب هو 200 جنيه مصري."
}
```

```json
{
  "status": "error",
  "message": "رصيد غير كاف متاح."
}
```

```json
{
  "status": "error",
  "message": "لديك طلب سحب قيد الانتظار بالفعل."
}
```

### Unauthorized (401)

```json
{
  "status": "error",
  "message": "Access token is required"
}
```

### Forbidden (403)

```json
{
  "status": "error",
  "message": "Access denied. Required roles: teacher"
}
```

### Not Found (404)

```json
{
  "status": "error",
  "message": "الملف الشخصي للمعلم غير موجود"
}
```

```json
{
  "status": "error",
  "message": "طلب السحب غير موجود"
}
```

## Business Rules

1. **Minimum Payout Amount**: 200 EGP
2. **Maximum Payout**: Cannot exceed available balance
3. **Pending Requests**: Only one pending request allowed at a time
4. **Balance Management**:
   - Amount is moved from `balance` to `payoutsPending` when request is created
   - Uses database transactions to ensure data consistency
5. **Banking Information**: Required before creating payout requests
6. **Currency**: All amounts are in EGP (Egyptian Pound)
7. **Account Number**: Must be exactly 16 digits
8. **IBAN Validation**: Must follow international IBAN format
9. **SWIFT Code**: Must be 8 or 11 characters
10. **Admin Actions**: Only super admins can approve/reject payout requests
11. **Status Flow**: pending → approved/rejected → completed (for approved)

## Database Transactions

The payout request creation and status updates use MongoDB transactions to ensure:

- Atomic operations (all succeed or all fail)
- Data consistency between wallet balance and payout requests
- Prevention of race conditions

## Status Management

### Payout Request Statuses:

- **pending**: Request submitted, waiting for admin review
- **approved**: Admin approved the request
- **rejected**: Admin rejected the request
- **completed**: Payment processed (for approved requests)

### Admin Actions:

- **approved**: Moves status to "completed", clears pending amount
- **rejected**: Moves status to "rejected", returns amount to available balance

## Testing

### Test Cases

1. **Teacher Endpoints**: Verify wallet creation, banking info management, payout requests
2. **Admin Endpoints**: Test payout request review and status updates
3. **Validation**: Test all validation rules and error messages
4. **Transactions**: Test concurrent operations and rollback scenarios
5. **Authorization**: Test role-based access control

### Sample Test Data

```json
{
  "amount": 300,
  "bankingInfo": {
    "bankName": "Test Bank",
    "accountHolderName": "Test User",
    "accountNumber": "1234567890123456",
    "iban": "EG123456789012345678901234",
    "swiftCode": "TESTEGCX"
  }
}
```

### Admin Test Scenarios

```json
// Approve request
{
  "action": "approved",
  "adminNotes": "Payment processed successfully"
}

// Reject request
{
  "action": "rejected",
  "adminNotes": "Documentation incomplete",
  "rejectionReason": "Please provide additional verification documents"
}
```
