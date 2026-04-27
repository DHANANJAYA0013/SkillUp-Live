# Face Detection-Based Attendance System - Implementation Guide

## Overview
This document outlines the complete face detection-based attendance system implemented for the SkillUp platform. The system automatically detects users' faces during live WebRTC sessions using face-api.js and TinyFaceDetector, then marks their attendance accordingly.

---

## Architecture

### Backend (MongoDB Collections & Express Routes)

#### Attendance Model (`server/models/Attendance.js`)
```
{
  sessionId: ObjectId (ref: Session),
  roomId: String (unique session identifier),
  mentorId: ObjectId (ref: User),
  date: String (ISO date),
  records: [{
    userId?: ObjectId,
    name: String,
    status: "waiting" | "present" | "absent",
    time?: String (HH:MM:SS format),
    faceDetected: Boolean
  }],
  waitingUsers: [{userId?, name, joinedAt}],
  faceDetectedUsers: [{userId?, name, joinedAt}],
  faceNotDetectedUsers: [{userId?, name, joinedAt}]
}
```

#### Attendance Routes (`server/routes/attendance.js`)
- **POST /attendance/create** - Creates/gets today's attendance for a session
- **POST /attendance/join** - Registers user in waitingUsers list when entering room
- **POST /attendance/mark** - Marks user as present after face detection; moves from waiting to faceDetectedUsers
- **GET /attendance/session/:sessionId** - Retrieves attendance details with present/absent/waiting users

---

## Frontend Implementation

### 1. Video Stream Setup (VideoTile.jsx)

**Key Change**: Added explicit `.play()` call after assigning `srcObject`

```jsx
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;
    // Force video playback to ensure live stream is fully active
    videoRef.current.play().catch((err) => {
      console.warn("[VideoTile] Video play() failed:", err);
    });
  }
}, [stream, videoRef]);
```

**Why**: Ensures the video element is actively playing before face detection attempts to read video data.

### 2. Face Detection Logic (VideoChatApp.jsx)

#### Model Loading
```jsx
// Loads TinyFaceDetector from public/models with retry logic
useEffect(() => {
  // Loads from: ${import.meta.env.BASE_URL}models
  await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL);
}, []);
```

**Important**: Ensure these files exist in `public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

#### Optimized Face Detection
```jsx
// Uses detectSingleFace() instead of detectAllFaces() for better performance
const detection = await faceapi.detectSingleFace(
  videoElement,
  new faceapi.TinyFaceDetectorOptions({ 
    inputSize: 416,
    scoreThreshold: 0.5 
  })
);

if (detection) {
  setFaceDetected(true);
  console.log("[face-api] Face detected:", {
    x: detection.box.x,
    y: detection.box.y,
    width: detection.box.width,
    height: detection.box.height,
    score: (detection.score * 100).toFixed(1) + "%"
  });
}
```

**Key Optimizations**:
- **detectSingleFace()**: Detects only one face per frame (faster than detectAllFaces)
- **inputSize: 416**: Medium resolution for balanced accuracy/performance
- **scoreThreshold: 0.5**: 50% confidence threshold (tunable)
- **Interval: 1.5s**: Check every 1.5 seconds (less CPU intensive than 1s)
- **Removed strict checks**: No longer requires localVideoReady state

#### Automatic Attendance Marking
```jsx
// When face is detected and not yet marked:
useEffect(() => {
  if (faceDetected && !attendanceMarked) {
    // Trigger attendance mark attempt
    setAttendanceAttemptToken((prev) => prev + 1);
  }
}, [faceDetected, attendanceMarked]);

// Attendance marking with retry logic:
const markAttendance = async () => {
  const payload = {
    sessionId: roomId,
    sessionIdentifier: roomId,
    userId,
    name: userName,
  };

  try {
    const res = await fetch(`${API_BASE}/attendance/mark`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      setAttendanceMarked(true);
      console.log("[attendance] Successfully marked");
      return;
    }
    
    // Retry after 5 seconds on failure
  } catch (error) {
    // Retry after 5 seconds on error
  }
};
```

---

## Console Debugging

The system logs comprehensive debug information to help troubleshoot issues:

### Face Detection Logs
```
[face-api] Loading TinyFaceDetector from http://localhost:5173/models...
[face-api] TinyFaceDetector model loaded successfully.
[face-api] Face detected (#1/5): {x: 120, y: 80, width: 200, height: 220, score: "85.3%"}
[face-api] No face detected (5 attempts)
[face-api] Detection stopped. Total attempts: 10, Successful: 2
```

### Attendance Logs
```
[attendance] Creating attendance document for session: {roomId: "ABC123", userName: "John"}
[attendance] Created attendance document: {attendanceId: "...", date: "2024-04-27"}
[attendance] Registering user in waiting list: {roomId: "ABC123", userName: "John"}
[attendance] Sending mark attendance request: {userName: "John", roomId: "ABC123"}
[attendance] Successfully marked attendance: {message: "Attendance marked successfully"}
```

### Socket Connection Logs
```
[socket] Connected to signal server with socketId: xyz123
[socket] Emitted join-room event: {roomId: "ABC123", userName: "John"}
[video] Local video ready: {readyState: 2, videoWidth: 1280, videoHeight: 720}
```

---

## Mentor Dashboard - Attendance Viewing

### Component: SessionAttendanceView (`components/SessionAttendanceView.tsx`)

Displays comprehensive attendance details for a specific session:

1. **Summary Statistics**
   - Total participants
   - Present count (face detected)
   - Absent count (face not detected)
   - Waiting count (pending detection)

2. **Face Detected Users List**
   - Shows all users with successful face recognition
   - Includes join timestamp
   - Green status indicator

3. **Face Not Detected Users List**
   - Shows all users who joined but weren't detected
   - Includes join timestamp
   - Red status indicator

4. **Waiting Users List**
   - Shows users still awaiting detection
   - Pulsing indicator
   - Only shown if count > 0

5. **Detailed Records Table**
   - Name, Status (Present/Absent/Waiting), Detection (Yes/No), Time
   - Sortable and exportable data
   - Timestamps in HH:MM:SS format

### Integration in Mentor Dashboard (`DashboardPage.tsx`)

Mentors can:
1. Navigate to Dashboard
2. Scroll to "Session Attendance" section
3. See list of completed sessions
4. Click "View Attendance" on any session
5. View comprehensive attendance breakdown

---

## Data Flow

```
User Joins Live Session (WebRTC)
    ↓
Socket Connection Established
    ↓
attendance/create called
    ├─ Creates attendance document if missing
    └─ Returns attendance ID
    ↓
attendance/join called
    ├─ Adds user to waitingUsers
    ├─ Adds user to faceNotDetectedUsers initially
    └─ Creates attendance record with status: "waiting"
    ↓
Face Detection Loop (every 1.5s)
    ├─ Checks video stream via detectSingleFace()
    └─ If face detected:
        ↓
        attendance/mark called
        ├─ Removes user from waitingUsers
        ├─ Removes user from faceNotDetectedUsers
        ├─ Adds user to faceDetectedUsers
        └─ Updates record to status: "present", faceDetected: true
        ↓
        Attendance Marked ✓
    ├─ If no face detected after timeout:
    └─ User remains in faceNotDetectedUsers
        status: "absent", faceDetected: false
```

---

## Configuration

### Environment Variables

**Frontend** (`.env` or `vite.config.ts`):
```
VITE_API_BASE=http://localhost:4000/api
VITE_SIGNAL_SERVER_URL=http://localhost:4000
```

**Backend** (`.env`):
```
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret
NODE_ENV=development
```

### Face Detection Parameters (Tunable in VideoChatApp.jsx)

```jsx
new faceapi.TinyFaceDetectorOptions({ 
  inputSize: 416,      // 320 (faster), 416 (balanced), 544+ (accurate)
  scoreThreshold: 0.5  // 0.1 (sensitive), 0.5 (balanced), 0.9 (strict)
})
```

Detection interval: `1500` (ms) - Adjust for performance

---

## Testing Checklist

### Local Testing
- [ ] Face model loads successfully (check console for "[face-api] TinyFaceDetector model loaded successfully")
- [ ] Video plays automatically after stream assignment
- [ ] Face detection starts within 3-5 seconds of joining room
- [ ] Console shows face detection attempts and success counts
- [ ] Attendance is marked automatically after face detection
- [ ] Mentor can view attendance from Dashboard > Session Attendance

### Production Testing
- [ ] Public/models files deployed to correct location
- [ ] API_BASE resolves to correct server URL
- [ ] CORS headers configured on backend
- [ ] WebRTC stream quality sufficient for face detection
- [ ] Attendance data persists in MongoDB

---

## Troubleshooting

### Face Detection Not Working
1. **Check console for model loading errors**
   ```
   [face-api] TinyFaceDetector model load failed...
   ```
   → Ensure `public/models/` files exist

2. **Check video readyState**
   ```
   [video] Local video ready: {readyState: 0, ...}
   ```
   → readyState should be ≥ 1; may need user interaction if 0

3. **Check face detection attempts**
   ```
   [face-api] No face detected (X attempts)
   ```
   → May need better lighting or camera positioning

### Attendance Not Marking
1. Check attendance/mark response in console
2. Verify backend API is responding
3. Check MongoDB for attendance document
4. Review retry logic (attempts every 5s)

### Performance Issues
1. Reduce detection frequency: `setInterval(..., 2000)` or `3000`
2. Reduce inputSize: `inputSize: 320` (faster, less accurate)
3. Increase scoreThreshold: `0.7` or `0.8` (fewer false positives)

---

## File References

- **Backend**: `server/routes/attendance.js`, `server/models/Attendance.js`
- **Frontend**: `skillup/src/features/videochat/VideoChatApp.jsx`, `VideoTile.jsx`
- **Component**: `skillup/src/components/SessionAttendanceView.tsx`
- **Dashboard**: `skillup/src/pages/DashboardPage.tsx`
- **Models**: `public/models/tiny_face_detector_model-*`

---

## Next Steps

1. **Deploy Face Detection Models**
   - Ensure `public/models/` files are in production build

2. **Monitor Attendance Accuracy**
   - Collect metrics on detection success rates
   - Adjust threshold if needed

3. **Enhance UI**
   - Add real-time detection status indicators
   - Export attendance reports as PDF/CSV

4. **Scale Considerations**
   - Monitor MongoDB query performance with large attendance datasets
   - Consider indexing on sessionId, mentorId, date
   - Cache frequently accessed reports

---

## Support & Debugging

Enable detailed logging by adding to console:
```javascript
localStorage.setItem('debug_attendance', 'true');
```

Then review browser DevTools Console for complete execution flow.

For issues, check:
1. Browser DevTools > Console tab
2. Network tab for API response codes
3. MongoDB for document creation
4. Backend server logs for errors
