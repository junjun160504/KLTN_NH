# QR Code Generation API Documentation

## Overview
Complete QR code generation system for restaurant table management with security token validation.

## API Endpoints

### 1. Generate QR for Specific Table
```http
POST /api/qr/generate/:tableId
```
**Description:** Generate QR code for a specific table
**Response:**
```json
{
  "status": 200,
  "message": "QR code generated successfully",
  "data": {
    "tableId": 5,
    "qrUrl": "http://localhost:3000/menu?table=5&session=a1b2c3d4e5f6g7h8",
    "imagePath": "/qr/table-5.png",
    "sessionToken": "a1b2c3d4e5f6g7h8",
    "generatedAt": "2024-10-01T10:30:00.000Z",
    "tableNumber": "B05",
    "tableName": "Bàn B05"
  }
}
```

### 2. Generate QR for All Tables
```http
POST /api/qr/generate-all
```
**Description:** Generate QR codes for all active tables
**Response:**
```json
{
  "status": 200,
  "message": "Generated QRs for 10/12 tables",
  "data": {
    "success": [...],
    "errors": [...],
    "total": 12,
    "successCount": 10,
    "errorCount": 2
  }
}
```

### 3. Validate QR Code
```http
POST /api/qr/validate
Content-Type: application/json

{
  "qrUrl": "http://localhost:3000/menu?table=5&session=a1b2c3d4e5f6g7h8"
}
```

### 4. Scan QR (Frontend Integration)
```http
GET /api/qr/scan?table=5&session=a1b2c3d4e5f6g7h8
```
**Description:** Validate QR from URL parameters (used by frontend after QR scan)

### 5. Get QR Information
```http
GET /api/qr/info/:tableId
```
**Description:** Get QR information for specific table

### 6. Download QR Image
```http
GET /api/qr/download/:tableId
```
**Description:** Download QR image file

### 7. Delete QR Code
```http
DELETE /api/qr/:tableId
```

## Security Features

### Token Generation
- **Algorithm:** SHA256 hash
- **Input:** `tableId + SECRET_KEY`
- **Output:** First 16 characters of hash
- **Example:** `"5-restaurant-qr-secret-2024"` → `"a1b2c3d4e5f6g7h8"`

### Validation Process
1. Extract `table` and `session` from QR URL
2. Regenerate expected token using `table + SECRET_KEY`
3. Compare generated vs provided token
4. Check table exists and is active

## Usage Examples

### 1. Admin Generate QR for Table 5
```bash
curl -X POST http://localhost:5000/api/qr/generate/5
```

### 2. Customer Scans QR
```bash
# Frontend calls this after QR scan
curl "http://localhost:5000/api/qr/scan?table=5&session=a1b2c3d4e5f6g7h8"
```

### 3. Start QR Session (Enhanced)
```bash
curl -X POST http://localhost:5000/api/qr-sessions/scan \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 5,
    "session_token": "a1b2c3d4e5f6g7h8",
    "customer_id": null
  }'
```

## Environment Variables
```env
QR_SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

## File Structure
```
backend/
├── src/
│   ├── utils/qrCodeUtils.js          # QR generation & validation
│   ├── services/tableQR.service.js   # Table QR management
│   ├── controllers/qr.controller.js  # HTTP request handlers
│   ├── routes/qr.routes.js          # API routes
│   └── services/qrSession.service.js # Enhanced session validation
└── public/
    └── qr/                          # Generated QR images
        ├── table-1.png
        ├── table-2.png
        └── ...
```

## Integration Points

### Frontend Integration
```javascript
// After QR scan, call validation endpoint
const validateQR = async (qrUrl) => {
  const response = await fetch('/api/qr/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrUrl })
  });
  return response.json();
};
```

### Session Creation
```javascript
// Create session with QR validation
const createSession = async (tableId, sessionToken) => {
  const response = await fetch('/api/qr-sessions/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      table_id: tableId,
      session_token: sessionToken
    })
  });
  return response.json();
};
```

## Error Handling
- Invalid table ID → `400 Bad Request`
- Table not found → `400 Bad Request`
- Invalid session token → `400 Bad Request`
- QR image not found → `404 Not Found`
- Server errors → `500 Internal Server Error`