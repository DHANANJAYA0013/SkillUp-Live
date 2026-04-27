# Face Detection Attendance System - Quick Testing Guide

## Prerequisites
- Node.js and npm installed
- MongoDB running locally or remote connection
- Two browsers/devices for testing (mentor + learner)
- Webcam access enabled

---

## Step 1: Verify Face Detection Model Files

Check that these files exist in the public directory:

```bash
# From skillup directory:
ls -la public/models/
```

**Expected output:**
```
tiny_face_detector_model-shard1
tiny_face_detector_model-weights_manifest.json
```

If missing, copy from your model training output or download from face-api.js repository.

---

## Step 2: Start Backend Server

```bash
cd server
npm install  # if needed
npm start    # or npm run dev
```

**Expected output:**
```
[SERVER] Listening on port 4000
[DB] MongoDB connected
```

Check console for any connection errors.

---

## Step 3: Start Frontend Development Server

```bash
cd skillup
npm install  # if needed
npm run dev
```

**Expected output:**
```
VITE v... ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Step 4: Test Face Detection Flow

### 4.1: Create a Test Session (Mentor)

1. **Login as Mentor**
   - Go to `http://localhost:5173/landing`
   - Click "Sign In"
   - Login with mentor account (or create one)

2. **Create a Session**
   - Go to Profile page
   - Click "Create New Session"
   - Fill in:
     - Title: "Face Detection Test"
     - Topic: "Testing"
     - Date: Today or tomorrow
     - Duration: 30 minutes
   - Click "Create Session"
   - Note the Room ID (e.g., "ABC123")

### 4.2: Join as Learner (First Browser/Device)

1. **Open new incognito/private window or different browser**
2. **Go to the live session**
   - Either click "Join Session" from Sessions page
   - Or navigate directly: `http://localhost:5173/room/ABC123?name=TestUser`

3. **Check Console (Browser DevTools)**
   - Open DevTools: F12 or Cmd+Option+I
   - Go to Console tab
   - Look for these logs (scroll up):

   ```
   [face-api] Loading TinyFaceDetector from http://localhost:5173/models...
   [face-api] TinyFaceDetector model loaded successfully.
   [socket] Connected to signal server with socketId: xyz123
   [attendance] Creating attendance document for session...
   [attendance] Created attendance document: {...}
   [attendance] Registering user in waiting list...
   [video] Local video ready: {readyState: 2, ...}
   ```

### 4.3: Verify Face Detection Starts

1. **Allow camera access** when browser prompts
2. **Position your face in camera frame**
3. **Watch console for detection logs**

   ✓ Expected within 3-5 seconds:
   ```
   [face-api] Face detected (#1/X): {x: 120, y: 80, width: 200, height: 220, score: "85.3%"}
   [attendance] Sending mark attendance request...
   [attendance] Successfully marked attendance: {...}
   ```

   ✗ If not appearing:
   - Check lighting (face should be well-lit)
   - Check camera angle (face should be facing camera directly)
   - Check browser console for errors
   - Try moving camera closer/further away

### 4.4: Monitor Attendance Status Display

1. **In video room header**
   - Watch the status message: "Loading face model..." → "Detecting Face..." → "Face detected - Marking attendance..." → "Face Detected - Attendance Marked"

2. **Check room video styling**
   - Room container should have `data-face-detected="true"` once detected

---

## Step 5: Verify Attendance in Database

### Option A: MongoDB Compass
1. Connect to your MongoDB
2. Navigate to: `database > sessions > attendance`
3. Find record with your roomId
4. Verify structure:
   ```json
   {
     "sessionId": "ObjectId",
     "roomId": "ABC123",
     "date": "2024-04-27",
     "waitingUsers": [],
     "faceDetectedUsers": [
       {"userId": "...", "name": "TestUser", "joinedAt": "..."}
     ],
     "faceNotDetectedUsers": [],
     "records": [
       {
         "userId": "...",
         "name": "TestUser",
         "status": "present",
         "time": "14:25:30",
         "faceDetected": true
       }
     ]
   }
   ```

### Option B: Terminal Query
```bash
# Connect to MongoDB
mongo

# In MongoDB shell
use skillup_db  # or your database name
db.attendance.find({roomId: "ABC123"}).pretty()
```

---

## Step 6: View Attendance in Mentor Dashboard

1. **Login as the mentor** (in first browser)
2. **Go to Dashboard**
   - Click Dashboard link or navigate to `/dashboard`

3. **Scroll to "Session Attendance" section**
   - Should show your completed session

4. **Click "View Attendance"**
   - Should display:
     - **Summary**: Total 1, Present 1, Absent 0, Waiting 0
     - **Face Detected Users**: Shows "TestUser" with checkmark
     - **Detailed Records**: Shows the attendance log

---

## Testing Scenarios

### Scenario 1: Face Detected (Happy Path)
**Expected Flow:**
```
Join Session → Video Loads → Face Detected → Attendance Marked ✓
```

**Verify:**
- ✓ Console shows face detection logs with coordinates
- ✓ Attendance status shows "Face Detected - Attendance Marked"
- ✓ Attendance document shows user in faceDetectedUsers
- ✓ Mentor dashboard shows "Present"

---

### Scenario 2: Face Not Detected (No Webcam)
**Setup:** Join without camera or with camera off

**Expected Flow:**
```
Join Session → Video Off → No Face Detected → User in faceNotDetectedUsers
```

**Verify:**
- ✓ Console shows "No face detected" repeatedly
- ✓ Attendance status stays at "Detecting Face..."
- ✓ Attendance document shows user in faceNotDetectedUsers
- ✓ Mentor dashboard shows "Absent"

---

### Scenario 3: Multiple Users
1. **Session with Mentor + 2 Learners**
2. Both learners join and show faces
3. **Expected:**
   - Mentor dashboard shows: "Total: 2, Present: 2, Absent: 0"

---

### Scenario 4: Retry Logic
**Simulate Network Error:**
1. Open DevTools Network tab
2. Check the "Offline" checkbox
3. Stop camera (or disable camera before face detected)
4. Uncheck "Offline"

**Expected:**
- System attempts attendance/mark retry after 5 seconds
- Once online, attendance marks successfully
- Check console for retry attempts

---

## Debugging Console Commands

### Check if Models Loaded
```javascript
faceapi.nets.tinyFaceDetector
// Should show: {loadFromUri: ƒ, ...}
```

### Check Video Element
```javascript
document.querySelector('video')
// Should show: <video ...> with readyState >= 1
```

### Check Face Detection Results
```javascript
// In console, monitor detection results:
setInterval(async () => {
  const video = document.querySelector('video');
  if (video && video.readyState >= 1) {
    const detection = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({inputSize: 416, scoreThreshold: 0.5})
    );
    console.log('Current detection:', detection);
  }
}, 1000);
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Loading face model..." stuck | Model files missing | Check `public/models/` directory |
| Face not detected with good lighting | Score threshold too high | Reduce scoreThreshold to 0.3 in code |
| "No face detected" repeatedly | Camera angle | Position face directly at camera |
| Attendance not marking | Backend error | Check server logs for `/attendance/mark` errors |
| API_BASE connection failed | Wrong URL | Check config in `VideoChatApp.jsx` |
| Attendance document not created | Permissions issue | Check MongoDB write permissions |

---

## Performance Monitoring

### Check Detection Performance
1. Open DevTools Performance tab
2. Record while face detection is running
3. Look for:
   - Face detection should take 100-300ms per cycle
   - Video rendering shouldn't be blocked

### Optimize if Slow
```javascript
// Increase detection interval (in VideoChatApp.jsx):
const detectionInterval = window.setInterval(() => {
  void detectFaces();
}, 2000); // Changed from 1500 to 2000ms
```

---

## Final Verification Checklist

- [ ] Face model loads within 3 seconds
- [ ] Video plays automatically after stream assigned
- [ ] Face detected within 5 seconds of joining
- [ ] Attendance marked automatically after detection
- [ ] Attendance document created in MongoDB
- [ ] Mentor can view attendance from dashboard
- [ ] Attendance shows correct participants count
- [ ] Face detected users listed correctly
- [ ] Face not detected users listed correctly
- [ ] Timestamps recorded accurately

---

## Next: Deploy to Production

Once testing passes locally:
1. Deploy models to production `public/models/`
2. Update `VITE_API_BASE` to production server
3. Update `VITE_SIGNAL_SERVER_URL` to production server
4. Test on production environment
5. Monitor MongoDB attendance collection size

See main documentation for deployment details.
