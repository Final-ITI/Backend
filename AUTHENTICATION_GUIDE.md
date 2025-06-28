# Authentication System Guide

## Overview

This authentication system implements a secure JWT-based authentication with refresh token rotation, device tracking, and comprehensive security features.

## Features

### 🔐 Security Features

- **JWT Access & Refresh Tokens**: Short-lived access tokens (15min) and longer-lived refresh tokens (7 days)
- **Token Hashing**: All tokens are hashed using SHA-256 before storage
- **Device Tracking**: Track user agent, IP address, device type, browser, and OS
- **Account Lockout**: Automatic account lockout after 5 failed login attempts
- **Token Revocation**: Comprehensive token revocation with reasons
- **Password Change Detection**: Automatically revokes tokens when password changes
- **Multi-tenant Support**: Academy-specific token isolation

### 🔄 Token Management

- **Refresh Token Rotation**: Prevents refresh token reuse
- **Session Management**: View and manage active sessions
- **Bulk Logout**: Logout from all devices
- **Token Validation**: Database-backed token validation

## API Endpoints

### Public Endpoints

#### 1. Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "student",
  "gender": "male",
  "country": "Egypt"
}
```

#### 2. Activate Email

```http
GET /api/v1/auth/activate/:activationCodeEmail
```

#### 3. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "userType": "student",
      "isEmailVerified": true,
      "profilePicture": null,
      "tenantId": null,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpires": "2024-01-01T00:15:00.000Z",
      "refreshTokenExpires": "2024-01-08T00:00:00.000Z"
    },
    "deviceInfo": {
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.1.1"
    }
  }
}
```

#### 4. Logout

```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

#### 5. Refresh Token

```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### Protected Endpoints (Require Authentication)

#### 6. Logout All Devices

```http
POST /api/v1/auth/logout-all
Authorization: Bearer access_token_here
```

#### 7. Get Active Sessions

```http
GET /api/v1/auth/sessions
Authorization: Bearer access_token_here
```

**Response:**

```json
{
  "status": "success",
  "message": "Active sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "token_id",
        "deviceType": "desktop",
        "browser": "Chrome",
        "os": "Windows",
        "ipAddress": "192.168.1.1",
        "lastActivity": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2024-01-08T00:00:00.000Z",
        "tokenType": "refresh"
      }
    ]
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Token Expiration (in minutes for access, days for refresh)
ACCESS_TOKEN_EXPIRES=15
REFRESH_TOKEN_EXPIRES=7
```

## Middleware Usage

### Authentication Middleware

```javascript
import {
  authenticate,
  authorize,
  authorizeTenant,
} from "../middlewares/auth.middleware.js";

// Protect route with authentication
router.get("/protected", authenticate, (req, res) => {
  // req.user contains the authenticated user
  res.json({ user: req.user });
});

// Role-based authorization
router.get(
  "/admin-only",
  authenticate,
  authorize("superadmin", "academy"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

// Tenant-based authorization
router.get("/academy/:academyId", authenticate, authorizeTenant, (req, res) => {
  res.json({ message: "Tenant access granted" });
});
```

### Available Middleware

1. **`authenticate`**: Verifies JWT access token and loads user
2. **`authorize(...roles)`**: Checks if user has required roles
3. **`authorizeTenant`**: Ensures user can only access their academy
4. **`optionalAuth`**: Optional authentication (doesn't fail if no token)
5. **`verifyTokenOnly`**: Fast token verification without database check
6. **`hasPermission(permission)`**: Checks specific permissions

## Security Features

### Account Lockout

- After 5 failed login attempts, account is locked for 2 hours
- Lock is automatically removed after successful login

### Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- All tokens are hashed before storage
- Tokens are automatically revoked on password change

### Device Tracking

- Tracks device type (mobile, tablet, desktop)
- Records browser and operating system
- Stores IP address for security monitoring

### Multi-tenant Isolation

- Users can only access their own academy
- Superadmin has access to all academies
- Token isolation per tenant

## Error Handling

The system provides detailed error messages:

```json
{
  "status": "fail",
  "message": "Account is temporarily locked. Try again in 120 minutes.",
  "statusCode": 423
}
```

Common error codes:

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `423`: Locked (account locked)

## Best Practices

1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Handle token refresh**: Implement automatic token refresh before expiration
3. **Monitor sessions**: Regularly check active sessions for security
4. **Use HTTPS**: Always use HTTPS in production
5. **Rate limiting**: Implement rate limiting on authentication endpoints
6. **Log security events**: Log failed login attempts and suspicious activity

## Token Refresh Flow

1. Client sends refresh token to `/auth/refresh-token`
2. Server validates refresh token
3. Server generates new access and refresh tokens
4. Old refresh token is revoked
5. New tokens are returned to client

## Session Management

Users can:

- View all active sessions
- Logout from current device
- Logout from all devices
- See device information for each session

This provides complete control over user sessions and enhances security.
