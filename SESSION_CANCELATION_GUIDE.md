# Session Management APIs - Frontend Documentation

## Overview

This documentation covers the session management APIs for halakat (classes) that allow teachers to cancel sessions, restore cancelled sessions, view analytics, and manage their session schedule.

## Base URL

```
https://your-api-domain.com/api/v1/halaka
```

## Authentication

All endpoints require JWT authentication with teacher authorization:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 1. Cancel Session API

**Endpoint:** `POST /api/v1/halaka/:id/cancel-session`

**Description:** Cancels a specific session and automatically extends the halaka end date to maintain the total number of sessions.

### Request Parameters

| Parameter   | Type   | Location | Required | Description                              |
| ----------- | ------ | -------- | -------- | ---------------------------------------- |
| id          | string | URL      | Yes      | Halaka ID                                |
| sessionDate | string | Body     | Yes      | Session date in ISO format or YYYY-MM-DD |
| reason      | string | Body     | No       | Reason for cancellation                  |

### Request Example

```javascript
// Next.js API call
const cancelSession = async (halakaId, sessionDate, reason) => {
  try {
    const response = await fetch(`/api/v1/halaka/${halakaId}/cancel-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionDate: "2025-07-21T05:52:29.756Z", // or "2025-07-21"
        reason: "Teacher illness",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Session cancelled:", data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error cancelling session:", error);
    throw error;
  }
};
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Session cancelled and schedule updated",
  "timestamp": "2025-07-20T08:30:00.000Z",
  "data": {
    "cancelledSession": {
      "sessionDate": "2025-07-21T00:00:00.000Z",
      "reason": "Teacher illness"
    },
    "newEndDate": "2025-08-13T00:00:00.000Z"
  }
}
```

### Error Responses

```json
// Session already cancelled
{
  "status": "error",
  "message": "Session was already cancelled",
  "timestamp": "2025-07-20T08:30:00.000Z"
}

// Invalid session date
{
  "status": "error",
  "message": "Session date is not a valid upcoming scheduled session",
  "timestamp": "2025-07-20T08:30:00.000Z"
}
```

---

## 2. Restore Session API

**Endpoint:** `POST /api/v1/halaka/:id/restore-session`

**Description:** Restores a previously cancelled session and recalculates the schedule end date.

### Request Parameters

| Parameter   | Type   | Location | Required | Description                |
| ----------- | ------ | -------- | -------- | -------------------------- |
| id          | string | URL      | Yes      | Halaka ID                  |
| sessionDate | string | Body     | Yes      | Date of session to restore |

### Request Example

```javascript
const restoreSession = async (halakaId, sessionDate) => {
  try {
    const response = await fetch(`/api/v1/halaka/${halakaId}/restore-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionDate: "2025-07-21",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Session restored:", data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error restoring session:", error);
    throw error;
  }
};
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Session restored successfully",
  "timestamp": "2025-07-20T08:30:00.000Z",
  "data": {
    "halaka": "687c41aa0d95d07d610a0e6b",
    "restoredSessionDate": "2025-07-21",
    "newEndDate": "2025-08-10T00:00:00.000Z",
    "cancelledSessionsCount": 0
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Session was not cancelled",
  "timestamp": "2025-07-20T08:30:00.000Z"
}
```

---

## 3. Get Session Analytics API

**Endpoint:** `GET /api/v1/halaka/:id/session-analytics`

**Description:** Retrieves comprehensive analytics about sessions including total, scheduled, cancelled, and completed sessions.

### Request Parameters

| Parameter | Type   | Location | Required | Description |
| --------- | ------ | -------- | -------- | ----------- |
| id        | string | URL      | Yes      | Halaka ID   |

### Request Example

```javascript
const getSessionAnalytics = async (halakaId) => {
  try {
    const response = await fetch(
      `/api/v1/halaka/${halakaId}/session-analytics`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("Session analytics:", data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Session analytics generated",
  "timestamp": "2025-07-20T08:30:00.000Z",
  "data": {
    "totalSessions": 7,
    "scheduledSessions": 8,
    "cancelledSessions": 1,
    "completedSessions": 4,
    "remainingSessions": 3,
    "extended": true,
    "originalEndDate": "2025-08-06T00:00:00.000Z",
    "currentEndDate": "2025-08-11T00:00:00.000Z"
  }
}
```

### Analytics Fields Explanation

| Field             | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| totalSessions     | Original number of sessions students paid for                         |
| scheduledSessions | Total session slots in current schedule (including extensions)        |
| cancelledSessions | Number of sessions that have been cancelled                           |
| completedSessions | Number of sessions that have been completed (with attendance)         |
| remainingSessions | Sessions yet to be completed                                          |
| extended          | Boolean indicating if schedule has been extended due to cancellations |
| originalEndDate   | Original end date before any cancellations                            |
| currentEndDate    | Current end date (may be extended)                                    |

---

## 4. Get Cancelled Sessions API

**Endpoint:** `GET /api/v1/halaka/:id/cancelled-sessions`

**Description:** Retrieves all cancelled sessions for a specific halaka with details about when and why they were cancelled.

### Request Parameters

| Parameter | Type   | Location | Required | Description |
| --------- | ------ | -------- | -------- | ----------- |
| id        | string | URL      | Yes      | Halaka ID   |

### Request Example

```javascript
const getCancelledSessions = async (halakaId) => {
  try {
    const response = await fetch(
      `/api/v1/halaka/${halakaId}/cancelled-sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("Cancelled sessions:", data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error fetching cancelled sessions:", error);
    throw error;
  }
};
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Cancelled sessions fetched successfully",
  "timestamp": "2025-07-20T08:30:00.000Z",
  "data": {
    "halaka": {
      "id": "687c41aa0d95d07d610a0e6b",
      "title": "حلقة تحفيظ القرآن للمبتدئين"
    },
    "cancelledSessions": [
      {
        "sessionDate": "2025-07-21T00:00:00.000Z",
        "cancelledAt": "2025-07-20T08:30:00.000Z",
        "reason": "Teacher illness",
        "cancelledBy": "أ. محمد أحمد"
      }
    ],
    "totalCancelled": 1,
    "originalEndDate": "2025-08-06T00:00:00.000Z",
    "extendedEndDate": "2025-08-11T00:00:00.000Z"
  }
}
```

---

## Next.js React Hook Examples

### Custom Hook for Session Management

```javascript
// hooks/useSessionManagement.js
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

export const useSessionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [cancelledSessions, setCancelledSessions] = useState([]);

  const cancelSession = useCallback(async (halakaId, sessionDate, reason) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/halaka/${halakaId}/cancel-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionDate, reason }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Session cancelled successfully");
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async (halakaId, sessionDate) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/halaka/${halakaId}/restore-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionDate }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Session restored successfully");
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (halakaId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/halaka/${halakaId}/session-analytics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.data);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCancelledSessions = useCallback(async (halakaId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/halaka/${halakaId}/cancelled-sessions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCancelledSessions(data.data.cancelledSessions);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    analytics,
    cancelledSessions,
    cancelSession,
    restoreSession,
    fetchAnalytics,
    fetchCancelledSessions,
  };
};
```

### React Component Example

```javascript
// components/SessionManagement.jsx
import React, { useEffect, useState } from "react";
import { useSessionManagement } from "../hooks/useSessionManagement";

const SessionManagement = ({ halakaId }) => {
  const {
    loading,
    analytics,
    cancelledSessions,
    cancelSession,
    restoreSession,
    fetchAnalytics,
    fetchCancelledSessions,
  } = useSessionManagement();

  const [cancelReason, setCancelReason] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (halakaId) {
      fetchAnalytics(halakaId);
      fetchCancelledSessions(halakaId);
    }
  }, [halakaId, fetchAnalytics, fetchCancelledSessions]);

  const handleCancelSession = async () => {
    if (!selectedDate) return;

    try {
      await cancelSession(halakaId, selectedDate, cancelReason);
      // Refresh data
      fetchAnalytics(halakaId);
      fetchCancelledSessions(halakaId);
      // Clear form
      setSelectedDate("");
      setCancelReason("");
    } catch (error) {
      console.error("Failed to cancel session:", error);
    }
  };

  const handleRestoreSession = async (sessionDate) => {
    try {
      await restoreSession(halakaId, sessionDate);
      // Refresh data
      fetchAnalytics(halakaId);
      fetchCancelledSessions(halakaId);
    } catch (error) {
      console.error("Failed to restore session:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Analytics Section */}
      {analytics && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Session Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalSessions}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.completedSessions}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.cancelledSessions}
              </div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.remainingSessions}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
          {analytics.extended && (
            <div className="mt-4 p-3 bg-yellow-100 rounded">
              <p className="text-sm text-yellow-800">
                Schedule extended due to cancellations. Original end:{" "}
                {new Date(analytics.originalEndDate).toLocaleDateString()},
                Current end:{" "}
                {new Date(analytics.currentEndDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cancel Session Form */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold mb-4">Cancel Session</h3>
        <div className="flex flex-col gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded"
            placeholder="Select session date"
          />
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="border p-2 rounded"
            placeholder="Reason for cancellation (optional)"
          />
          <button
            onClick={handleCancelSession}
            disabled={!selectedDate || loading}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Cancel Session
          </button>
        </div>
      </div>

      {/* Cancelled Sessions List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold mb-4">Cancelled Sessions</h3>
        {cancelledSessions.length === 0 ? (
          <p className="text-gray-500">No cancelled sessions</p>
        ) : (
          <div className="space-y-3">
            {cancelledSessions.map((session, index) => (
              <div
                key={index}
                className="border p-3 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Reason: {session.reason || "No reason provided"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Cancelled by: {session.cancelledBy}
                  </div>
                </div>
                <button
                  onClick={() => handleRestoreSession(session.sessionDate)}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;
```

---

## Error Handling

### Common Error Codes

| Status Code | Description           | Possible Causes                              |
| ----------- | --------------------- | -------------------------------------------- |
| 400         | Bad Request           | Missing required fields, invalid date format |
| 403         | Forbidden             | Not authenticated, not the halaka owner      |
| 404         | Not Found             | Halaka not found or not owned by teacher     |
| 500         | Internal Server Error | Server-side error                            |

### Error Response Format

All error responses follow this structure:

```json
{
  "status": "error",
  "message": "Description of the error",
  "timestamp": "2025-07-20T08:30:00.000Z"
}
```

---

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Show user feedback** - Use toast notifications or loading states
3. **Validate dates** - Ensure session dates are valid and in the future for cancellation
4. **Refresh data** - After cancelling/restoring sessions, refresh analytics and session lists
5. **Store tokens securely** - Use secure storage methods for JWT tokens
6. **Handle offline states** - Implement proper error handling for network failures

---

## Testing Examples

### Test Session Cancellation

```javascript
// Test with valid session date
const testCancel = async () => {
  try {
    const result = await cancelSession(
      "687c41aa0d95d07d610a0e6b",
      "2025-07-21",
      "Testing"
    );
    console.log("Cancel success:", result);
  } catch (error) {
    console.error("Cancel failed:", error);
  }
};

// Test with invalid session date
const testInvalidCancel = async () => {
  try {
    const result = await cancelSession(
      "687c41aa0d95d07d610a0e6b",
      "2025-07-20",
      "Testing"
    );
  } catch (error) {
    console.log("Expected error:", error.message); // Should be "Session date is not valid..."
  }
};
```

This documentation provides everything needed for frontend developers to integrate the session management APIs effectively in their Next.js applications.
