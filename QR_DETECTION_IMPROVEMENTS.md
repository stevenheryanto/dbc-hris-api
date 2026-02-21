# QR Code Detection Improvements

## What Was Improved

### 1. Multiple Detection Strategies
The QR detection now tries 6 different image processing strategies:

1. **Original Image** - Try detecting on the raw image first
2. **Resized (800px)** - Resize to standard size for better processing
3. **Grayscale** - Convert to grayscale to improve contrast
4. **High Contrast** - Increase contrast by 1.5x
5. **Adjusted Brightness** - Increase brightness by 1.2x
6. **Larger Size (1200px)** - Try with larger resolution

Each strategy is tried in sequence until a QR code is found.

### 2. Better Image Processing
- **Auto-rotation**: Automatically rotates image based on EXIF data
- **Contrast enhancement**: Improves QR code visibility
- **Brightness adjustment**: Helps with dark or overexposed photos
- **Grayscale conversion**: Removes color noise

### 3. Flexible QR Matching
The verification now supports:
- **Exact match**: Direct URL comparison
- **Partial match**: Checks if office name is in QR data
- **Case-insensitive**: Matches office names regardless of case
- **Phone + name match**: Verifies both phone number and office name

### 4. Better Logging
- Detailed console logs for debugging
- Shows which strategy succeeded
- Logs comparison details for each office
- Indonesian error messages for users

### 5. Test Endpoint
New `/api/qr-test` endpoints for debugging:
- `POST /api/qr-test/detect` - Test QR detection on any photo
- `GET /api/qr-test/offices` - See expected QR data for all offices

## How to Test

### Method 1: Using the Test Endpoint

1. **Start the API server**:
   ```bash
   cd dbc-hris-api
   bun run dev
   ```

2. **Open Swagger UI**:
   ```
   http://localhost:3000/swagger
   ```

3. **Test QR Detection**:
   - Go to "QR Test" section
   - Use `POST /api/qr-test/detect`
   - Upload a photo with QR code
   - See detection results and logs

4. **Check Expected QR Data**:
   - Use `GET /api/qr-test/offices`
   - See what QR data each office expects
   - Compare with what your QR code contains

### Method 2: Using the Mobile App

1. **Create an office** (if not exists):
   ```bash
   POST /api/offices
   {
     "officeName": "Main Office",
     "officeDescription": "Head Office",
     "checkInLat": -6.123456,
     "checkInLng": 106.123456,
     "checkInAddress": "Jakarta"
   }
   ```

2. **Get the QR code**:
   ```bash
   GET /api/offices/:id
   ```
   - The `qrCode` field contains a data URL
   - Display this on screen or print it

3. **Test with mobile app**:
   - Open CheckInActivity
   - Take selfie with QR code visible in background
   - Watch the verification process
   - Check server logs for detection details

### Method 3: Check Server Logs

The server now logs detailed information:

```
=== Starting QR Verification ===
File name: photo.jpg
File type: image/jpeg
File size: 1234567
Starting QR detection, file size: 1234567
Trying strategy 1: { resize: null, grayscale: false, ... }
Processed image: 1920x1080, channels: 4
Trying strategy 2: { resize: 800, grayscale: false, ... }
✓ QR Code detected with strategy 2: https://wa.me/...
Verifying QR data: https://wa.me/...
Checking against 3 active offices
Comparing with office "Main Office":
  Expected: https://wa.me/1234567890?text=%23Main%20Office
  Got:      https://wa.me/1234567890?text=%23Main%20Office
✓ Exact match found!
=== QR Verification Complete ===
```

## Troubleshooting

### QR Code Still Not Detected

1. **Check QR code quality**:
   - QR code should be clear and not blurry
   - Good lighting is important
   - QR code should be at least 100x100 pixels in the photo

2. **Check QR code content**:
   - Use `GET /api/qr-test/offices` to see expected format
   - Scan the QR code with a QR scanner app
   - Compare the scanned data with expected data

3. **Check photo quality**:
   - Photo should be at least 800x600 pixels
   - Not too dark or too bright
   - QR code should be visible and not obstructed

4. **Check server logs**:
   - Look for "QR Code detected" messages
   - Check which strategy worked (if any)
   - See comparison results

### QR Code Detected But Not Verified

1. **Check office name encoding**:
   - Office name might have special characters
   - Check URL encoding in expected vs actual

2. **Check phone number**:
   - Verify `CHATBOT_NO` in `.env` file
   - Should match the phone in QR code

3. **Check office status**:
   - Office must have `status = 'active'`
   - Check database: `SELECT * FROM master_office`

## Tips for Better Detection

1. **QR Code Size**: Make QR code at least 3-4 cm when printed
2. **Lighting**: Use good lighting, avoid shadows on QR code
3. **Distance**: Keep QR code 30-50 cm from camera
4. **Angle**: Try to keep QR code flat and facing camera
5. **Background**: Use contrasting background (white QR on dark, or vice versa)

## Error Messages

| Message (Indonesian) | Meaning | Solution |
|---------------------|---------|----------|
| "Tidak ada QR code terdeteksi..." | No QR found | Ensure QR is visible and clear |
| "QR code does not match any registered office" | QR found but wrong office | Check office name and phone number |
| "Error verifying QR code" | Server error | Check server logs |
