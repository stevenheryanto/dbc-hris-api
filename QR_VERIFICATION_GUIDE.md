# QR Code Verification System

## Overview
The system now verifies that employee selfies contain the office's QR code during check-in. This ensures employees are physically present at the correct office location.

## How It Works

### 1. Office QR Code Generation
- Each office has a unique QR code generated when created
- QR code contains: `https://wa.me/{CHATBOT_NO}?text=%23{officeName}`
- QR code is stored as a data URL in the database

### 2. Check-In Process
1. Employee opens CheckInActivity (full-screen front camera)
2. Employee takes selfie with office QR code visible in background
3. Photo is uploaded to backend
4. Backend detects and decodes QR code from photo
5. Backend verifies QR code matches a registered office
6. Attendance is approved/rejected based on verification

### 3. Backend Verification Flow

```
Photo Upload → QR Detection → QR Verification → Status Update
                  ↓                  ↓                ↓
              jsQR lib        Match office DB    approved/rejected
```

## API Changes

### POST /mobile/attendance
**Request:**
- Same as before (multipart/form-data with checkInPhoto)

**Response:**
```json
{
  "message": "Attendance verified successfully for Office Name",
  "attendance": { ... },
  "qrVerification": {
    "isValid": true,
    "officeName": "Main Office",
    "message": "QR code verified for office: Main Office"
  }
}
```

## Database Changes

### attendances table
- Added `office_id` column (bigint, nullable, foreign key to master_office)
- Added index on `office_id`
- Status automatically set to 'approved' if QR verified, 'rejected' if not

## New Services

### QRVerificationService
- `detectQRCode(file)`: Detects QR code in image using jsQR
- `verifyOfficeQRCode(qrData)`: Verifies QR data matches an office
- `verifyAttendancePhoto(file)`: Complete verification workflow

### AttendanceService Updates
- `savePhotoWithVerification()`: Saves photo and verifies QR code
- `createAttendance()`: Now accepts `officeId` and `qrVerified` parameters

## Dependencies Added
- `jsqr`: QR code detection library
- `sharp`: Image processing library

## Migration
Run the migration to add office_id column:
```bash
bun run db:migrate
```

## Testing

### 1. Create an Office
```bash
POST /offices
{
  "officeName": "Test Office",
  "officeDescription": "Test",
  "checkInLat": -6.123456,
  "checkInLng": 106.123456,
  "checkInAddress": "Test Address"
}
```

### 2. Display QR Code
- Get office details: `GET /offices/:id`
- Display `qrCode` (data URL) on screen or print it

### 3. Test Check-In
- Take selfie with QR code visible
- Submit attendance
- Check response for verification result

## Error Messages

| Scenario | Message |
|----------|---------|
| No QR detected | "No QR code detected in photo. Please ensure the office QR code is visible in your selfie." |
| Invalid QR | "QR code does not match any registered office" |
| Valid QR | "QR code verified for office: {officeName}" |

## Mobile App Changes Needed

The mobile app should:
1. Show instructions to include QR code in selfie
2. Display verification result after submission
3. Handle rejected attendances appropriately

## Security Considerations

1. QR codes are unique per office
2. QR data includes office name for verification
3. Photos are stored for audit purposes
4. Failed verifications are logged with reason
5. Admins can still manually approve/reject if needed
