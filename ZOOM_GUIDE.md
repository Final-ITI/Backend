```markdown
# Zoom Integration API Documentation

_Last updated: July 19, 2025_

Base Route: `/api/v1/zoom`

---

## Table of Contents

- [General Notes](#general-notes)
- [Generate Zoom Signature](#generate-zoom-signature)
- [Get ZAK Token](#get-zak-token)
- [Zoom Integration in Halaka Creation](#zoom-integration-in-halaka-creation)
- [Errors & Validation](#errors--validation)

---

## General Notes

- All routes require JWT authentication unless otherwise specified.
- These endpoints handle Zoom SDK JWT and meeting creation for client apps and automated halaka scheduling.
- Meetings are created as recurring/fixed-time meetings and are linked to halakat.

---

## Generate Zoom Signature

**POST** `/api/v1/zoom/signature`

### Description

Generates a signature for joining a Zoom meeting via Zoom SDK (client-side video integration).

### Request Headers

- `Authorization: Bearer `

### Request Body

| Field         | Type   | Required | Description            |
| ------------- | ------ | -------- | ---------------------- |
| meetingNumber | string | Yes      | Zoom Meeting ID        |
| role          | number | Yes      | 0 = Attendee, 1 = Host |
```

{
"meetingNumber": "74382934944",
"role": 1
}

```

### Success Response

- **Code:** 201
- **Content:**
```

{
"status": "created",
"message": "Zoom signature generated successfully",
"data": {
"signature": ""
}
}

```

### Error Response

- **Code:** 400
- **Body:**
```

{
"status": "error",
"message": "meetingNumber and role are required"
}

```

---

## Get ZAK Token

**POST** `/api/v1/zoom/zak-token`

### Description
Retrieves a Zoom ZAK token for starting/joining meetings as host (useful for instant start/host flows).

### Request Headers

- `Authorization: Bearer `

### Request Body or Params

| Field    | Type   | Required | Description                |
|----------|--------|----------|----------------------------|
| userId   | string | Yes      | Zoom user id or email      |

```

{
"userId": "teacher-zoom-email-or-id@domain.com"
}

```

### Success Response

- **Code:** 200
- **Content:**
```

{
"zak": ""
}

```

### Error Response

- **Code:** 400 or 500
```

{
"message": "userId is required"
}
// OR
{
"message": "Failed to fetch ZAK token"
}

```

---

## Zoom Integration in Halaka Creation

Zoom meeting creation is fully integrated in the [Halaka module](#).

- When a teacher creates a new halaka (`POST /api/v1/halaka/`), a **recurring Zoom meeting is created automatically** in the pre-save hook.
- The Zoom meeting's info is saved within the Halaka object:
  - `meetingId`
  - `password`
  - `joinUrl`
  - `startUrl`
- The recurrence pattern respects the halaka's schedule (`startDate`, `endDate`, `days`, and frequency).
- The created Zoom meeting can be accessed from the halaka's `zoomMeeting` field.

**No manual action is needed from the frontend to make Zoom meetings for halakat—it's automatic.**

---

## Typical Flow for Zoom Usage

1. **Teacher creates halaka:**
   - Halaka is created with schedule, and a Zoom meeting is automatically provisioned (with recurrence) for the entire period.
   - The Zoom meeting details are returned as part of the halaka object.

2. **Client (browser or mobile) wants to join session:**
   - Frontend obtains:
     - The Zoom meeting number (`zoomMeeting.meetingId`)
     - The Zoom password and joinUrl
     - A signature for the SDK using `/zoom/signature` endpoint

3. **Advanced/host flows:**
   - To start a meeting as host in native Zoom client or SDK, the frontend may use ZAK token via `/zoom/zak-token`.

---

## Errors & Validation

- All errors are returned as JSON with a `status` and a `message`.
- Missing parameters in requests yield `400` errors with a message specifying the missing field.
- If Zoom API credentials/config are missing/misconfigured, a `500` error is returned.

---

## Example: Join a Meeting as Attendee (Frontend Flow)

1. Get `meetingNumber` and `password` from the halaka's `zoomMeeting` field.
2. POST to `/api/v1/zoom/signature` with:
```

{ "meetingNumber": "74382934944", "role": 0 }

```
Save the `signature` from the response.
3. Launch Zoom Web SDK or Native client using these values:
```

ZoomMtg.init(...);
ZoomMtg.join({ meetingNumber, userName, signature, apiKey, password });

```

```
