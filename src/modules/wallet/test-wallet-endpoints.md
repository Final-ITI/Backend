# Wallet Endpoints Testing Guide

## Prerequisites

1. A teacher account with authentication token
2. Postman or similar API testing tool
3. MongoDB connection

## Test Scenarios

### 1. Get Wallet Balance

**Endpoint:** `GET /api/v1/wallet/my-balance`

**Test Cases:**

- ✅ New teacher (should create wallet automatically)
- ✅ Existing teacher with balance
- ✅ Invalid token (should return 401)
- ✅ Non-teacher user (should return 403)

**Expected Response for New Teacher:**

```json
{
  "status": "success",
  "message": "تم جلب رصيد المحفظة بنجاح",
  "data": {
    "wallet": {
      "balance": 0,
      "pendingBalance": 0,
      "payoutsPending": 0,
      "currency": "EGP"
    },
    "user": {
      "firstName": "Teacher",
      "lastName": "Name"
    }
  }
}
```

### 2. Banking Information Management

#### 2.1 Get Banking Info

**Endpoint:** `GET /api/v1/wallet/banking-info`

**Test Cases:**

- ✅ No banking info (should return empty object with message)
- ✅ With banking info (should return complete data)
- ✅ Invalid token

#### 2.2 Update Banking Info

**Endpoint:** `PUT /api/v1/wallet/banking-info`

**Test Cases:**

- ✅ Valid banking info
- ✅ Invalid bank name (special characters)
- ✅ Invalid account number (not 16 digits)
- ✅ Invalid IBAN format
- ✅ Invalid SWIFT code
- ✅ Missing required fields

**Valid Test Data:**

```json
{
  "bankName": "Commercial International Bank",
  "accountHolderName": "Ahmed Mohamed Ali",
  "accountNumber": "1234567890123456",
  "iban": "EG123456789012345678901234",
  "swiftCode": "CIBEEGCX"
}
```

**Invalid Test Cases:**

```json
// Invalid account number
{
  "bankName": "Test Bank",
  "accountHolderName": "Test User",
  "accountNumber": "123456789", // Not 16 digits
  "iban": "EG123456789012345678901234",
  "swiftCode": "TESTEGCX"
}

// Invalid IBAN
{
  "bankName": "Test Bank",
  "accountHolderName": "Test User",
  "accountNumber": "1234567890123456",
  "iban": "INVALID_IBAN", // Invalid format
  "swiftCode": "TESTEGCX"
}
```

### 3. Payout Requests

#### 3.1 Create Payout Request

**Endpoint:** `POST /api/v1/wallet/payout-requests`

**Prerequisites:**

- Teacher must have banking info
- Teacher must have sufficient balance
- No pending payout request

**Test Cases:**

- ✅ Valid amount (≥ 200 EGP)
- ✅ Amount below minimum (should return 400)
- ✅ Amount exceeds balance (should return 400)
- ✅ No banking info (should return 400)
- ✅ Existing pending request (should return 400)
- ✅ Invalid amount format

**Valid Test Data:**

```json
{
  "amount": 300
}
```

**Test Flow:**

1. Add banking info first
2. Ensure sufficient balance
3. Create payout request
4. Verify balance is reduced and moved to `payoutsPending`

#### 3.2 Get Payout History

**Endpoint:** `GET /api/v1/wallet/payout-requests`

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page (max 100)
- `status`: Filter by status

**Test Cases:**

- ✅ No parameters (default pagination)
- ✅ With pagination parameters
- ✅ Filter by status
- ✅ Invalid status filter
- ✅ Invalid pagination parameters

**Example Queries:**

```
GET /api/v1/wallet/payout-requests
GET /api/v1/wallet/payout-requests?page=1&limit=5
GET /api/v1/wallet/payout-requests?status=pending
GET /api/v1/wallet/payout-requests?status=approved&page=2&limit=10
```

## Database Verification

### Check Wallet Document

```javascript
// In MongoDB shell or Compass
db.teacherwallets.findOne({ teacher: ObjectId("teacher_id") });
```

### Check Payout Requests

```javascript
// In MongoDB shell or Compass
db.payoutrequests
  .find({ teacher: ObjectId("teacher_id") })
  .sort({ createdAt: -1 });
```

### Verify Transaction Integrity

After creating a payout request, verify:

1. Wallet balance is reduced by the amount
2. `payoutsPending` is increased by the amount
3. Payout request document is created with correct data
4. Banking info is copied from teacher profile

## Error Scenarios to Test

### 1. Concurrent Payout Requests

- Try to create multiple payout requests simultaneously
- Should only allow one pending request

### 2. Insufficient Balance Race Condition

- Create payout request with exact balance
- Try to create another request immediately
- Should fail gracefully

### 3. Invalid Banking Info

- Test with various invalid formats
- Verify validation messages are clear

### 4. Network Issues

- Test with slow connections
- Verify transaction rollback on failure

## Performance Testing

### 1. Large Payout History

- Create many payout requests
- Test pagination performance
- Verify response times

### 2. Database Load

- Monitor MongoDB performance during transactions
- Check for proper indexing

## Security Testing

### 1. Authorization

- Test with different user roles
- Verify teacher-only access

### 2. Data Validation

- Test with malicious input
- Verify XSS prevention
- Check SQL injection prevention

### 3. Token Security

- Test with expired tokens
- Test with invalid tokens
- Verify proper error messages

## Monitoring Points

1. **Transaction Success Rate**: Monitor failed transactions
2. **Response Times**: Track API performance
3. **Error Rates**: Monitor validation and business logic errors
4. **Database Performance**: Monitor query execution times
5. **Balance Accuracy**: Verify wallet balance calculations

## Common Issues and Solutions

### Issue: "Teacher profile not found"

**Solution:** Ensure teacher document exists and is linked to user

### Issue: "Insufficient balance"

**Solution:** Check if balance calculation is correct, verify no pending transactions

### Issue: "Banking info required"

**Solution:** Add banking information before creating payout request

### Issue: "Pending request exists"

**Solution:** Wait for current request to be processed or cancelled

### Issue: "Validation failed"

**Solution:** Check input format, especially account number (16 digits) and IBAN format
