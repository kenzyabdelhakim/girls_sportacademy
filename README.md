# 🏆 Sports Academy Attendance Management System

A modern, full-featured attendance management web application built for sports academies using React, Vite, Firebase, and QR Code technology.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.8-purple)
![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-cyan)

## ✨ Features

### 🔐 Authentication
- Secure Firebase Email/Password authentication
- Protected routes for admin access
- Session management with auto-logout

### 📊 Dashboard
- Real-time statistics (total students, today's attendance, attendance percentage)
- Quick action buttons for common tasks
- Recent attendance list with live updates
- Beautiful, responsive cards with gradient designs

### 👥 Student Management
- **Add** new students with complete information
- **Edit** existing student details
- **Delete** students with confirmation
- **Search** students by name, ID, or group
- Responsive grid layout for student cards
- Student fields:
  - Student ID (unique identifier)
  - Full Name
  - Age
  - Group/Team
  - Phone Number
  - Created timestamp

### 📱 QR Code System
- Generate unique QR codes for each student
- QR codes contain student ID for secure scanning
- **Download** QR codes as PNG images
- **Print** QR codes with formatted cards
- Beautiful QR card design with student information

### 📷 QR Scanner
- Live camera scanning using html5-qrcode
- Real-time QR code detection
- Success/error animations and feedback
- Audio feedback (success/error sounds)
- Automatic duplicate prevention (one scan per day)
- Mobile and desktop camera support
- Torch/flashlight support on compatible devices

### ✅ Attendance System
- Mark attendance by scanning QR codes
- Automatic duplicate detection (prevents multiple scans per day)
- Records include:
  - Student ID and Name
  - Group/Team
  - Date and Time
  - Status (Present)
  - Timestamp

### 📈 Attendance History
- View all attendance records
- **Filter by date** - Select specific dates
- **Filter by group** - View team-specific attendance
- **Search** by student name or ID
- **Export to CSV** - Download attendance reports
- Responsive table and card views
- Real-time statistics

### 🎨 Modern UI/UX
- Clean, professional design with Tailwind CSS
- Smooth animations and transitions
- Mobile-first responsive design
- Loading states and skeleton screens
- Toast notifications for user feedback
- Empty states with helpful messages
- Gradient backgrounds and modern cards
- Dark-friendly color scheme

## 🛠️ Tech Stack

- **Frontend Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Styling:** Tailwind CSS 3.3.6
- **Backend/Database:** Firebase (Firestore)
- **Authentication:** Firebase Auth
- **QR Generation:** qrcode 1.5.3
- **QR Scanning:** html5-qrcode 2.3.8
- **Routing:** React Router DOM 6.20.0
- **Icons:** Lucide React 0.294.0
- **Notifications:** React Hot Toast 2.4.1
- **Date Handling:** date-fns 2.30.0

## 📁 Project Structure

```
sports-academy-attendance/
├── public/
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Reusable components
│   │   ├── AttendanceTable.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── QRCard.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx
│   ├── firebase/            # Firebase configuration
│   │   └── config.js
│   ├── layouts/             # Layout components
│   │   └── MainLayout.jsx
│   ├── pages/               # Page components
│   │   ├── Attendance.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Scanner.jsx
│   │   └── Students.jsx
│   ├── services/            # API services
│   │   ├── attendanceService.js
│   │   └── studentService.js
│   ├── App.jsx              # Main app component
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── .env.example             # Environment variables template
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sports-academy-attendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project or use an existing one
   
   c. Enable **Firestore Database**:
      - Go to Firestore Database
      - Click "Create Database"
      - Start in production mode (or test mode for development)
      - Choose a location
   
   d. Enable **Authentication**:
      - Go to Authentication
      - Click "Get Started"
      - Enable "Email/Password" sign-in method
      - Create an admin user in the "Users" tab
   
   e. Get your Firebase configuration:
      - Go to Project Settings (gear icon)
      - Scroll down to "Your apps"
      - Click the web icon (</>)
      - Copy the configuration object

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Creating an Admin User

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Use these credentials to login to the app

## 🔥 Firebase Structure

### Collections

#### `students`
```javascript
{
  studentId: "STU001",        // Unique student ID
  fullName: "John Doe",       // Student's full name
  age: 15,                    // Student's age
  group: "Team A",            // Group/Team name
  phone: "+1234567890",       // Phone number (optional)
  createdAt: Timestamp        // Creation timestamp
}
```

#### `attendance`
```javascript
{
  studentId: "STU001",        // Reference to student
  studentName: "John Doe",    // Student's name (denormalized)
  group: "Team A",            // Group/Team name
  date: "2024-01-15",         // Date (YYYY-MM-DD)
  time: "09:30:45",           // Time (HH:mm:ss)
  status: "present",          // Attendance status
  createdAt: Timestamp        // Creation timestamp
}
```

### Firestore Rules (Recommended)

**IMPORTANT:** You must update your Firestore security rules to allow students to access their data.

Go to Firebase Console → Firestore Database → Rules tab and use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Students collection
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Session materials collection
    match /session_materials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Click "Publish" to apply the rules.

**Note:** These rules allow any authenticated user to read/write all data. For production environments with higher security requirements, see the `firestore.rules` file in the project root for more restrictive role-based rules.

## 📱 Usage Guide

### For Administrators

1. **Login**
   - Use your Firebase admin credentials
   - Access the dashboard

2. **Add Students**
   - Go to Students page
   - Click "Add Student"
   - Fill in student information
   - Submit the form

3. **Generate QR Codes**
   - Click "QR Code" button on any student card
   - Download or print the QR code
   - Distribute to students

4. **Mark Attendance**
   - Go to Scanner page
   - Click "Start Scanner"
   - Allow camera access
   - Scan student QR codes
   - Receive instant feedback

5. **View Reports**
   - Go to Attendance page
   - Use filters to narrow down results
   - Export data as CSV for external analysis

### For Students

1. Receive your QR code from the administrator
2. Keep it accessible (printed card or digital image)
3. Present it to the scanner when arriving
4. Wait for confirmation sound and message

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel**
   - Go to your project settings
   - Add all VITE_FIREBASE_* variables
   - Redeploy

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build and deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Set environment variables in Netlify**
   - Go to Site settings → Environment variables
   - Add all VITE_FIREBASE_* variables

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use Firebase Security Rules** - Restrict database access
3. **Enable App Check** - Protect against abuse
4. **Regular backups** - Export Firestore data regularly
5. **Monitor usage** - Check Firebase console for anomalies
6. **Rotate credentials** - Update Firebase keys periodically

## 🐛 Troubleshooting

### Camera Not Working on Scanner Page

**Issue:** Camera fails to start, shows permission errors, or displays "HTTPS required" message.

**Root Cause:** Modern browsers require HTTPS (secure connection) to access device cameras for security reasons.

**Solutions:**

1. **For Local Development:**
   - Follow the detailed guide in `setup-https.md`
   - Quick option: Install `mkcert` and generate local SSL certificates
   - Set `VITE_HTTPS=true` in your `.env` file
   - Restart the dev server

2. **For Production:**
   - Deploy to a hosting service with automatic HTTPS (Vercel, Netlify, Firebase Hosting)
   - All major hosting platforms provide HTTPS by default

3. **Alternative for Testing:**
   - Use `localhost` (browsers allow camera access on localhost even without HTTPS)
   - Access via `http://localhost:5173` instead of `http://127.0.0.1:5173`

**Verification Steps:**
1. Check the lock icon in your browser's address bar (should show secure connection)
2. Click the lock icon and verify camera permissions are allowed
3. Check browser console for specific error messages
4. Try a different browser if issues persist

**See `setup-https.md` for complete HTTPS setup instructions.**

### Student Login - "Missing or insufficient permissions" Error

**Issue:** Student can login but sees errors like "Missing or insufficient permissions" and dashboard shows no data.

**Root Cause:** Firestore security rules are blocking authenticated students from reading their attendance and materials data.

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" → "Rules" tab
4. Replace existing rules with the rules shown in the "Firestore Rules" section above
5. Click "Publish"
6. Refresh the student portal

**Verification:** After updating rules, students should be able to see their attendance stats and materials without permission errors.

### Student Login Not Redirecting to Dashboard

**Issue:** After successful login, the "Welcome back!" toast appears but the student stays on the login page.

**Root Cause:** The `login()` function in `StudentAuthContext` was only setting `studentData` but not `currentStudent`. The `StudentProtectedRoute` checks for both values, causing a mismatch where the route protection blocked access even after successful authentication.

**Solution Applied:**
1. Modified `login()` function to set both `currentStudent` and `studentData` immediately after Firebase authentication
2. Added direct navigation in `StudentLogin.jsx` after successful login using `navigate('/student/dashboard', { replace: true })`
3. The `useEffect` in `StudentLogin.jsx` also handles auto-redirect for already logged-in users

**Files Modified:**
- `src/student/contexts/StudentAuthContext.jsx` - Added `setCurrentStudent(userCredential.user)` in login function
- `src/student/pages/StudentLogin.jsx` - Added immediate navigation after successful login
- `src/student/components/StudentProtectedRoute.jsx` - Cleaned up unnecessary navigation logic

### Camera not working
- **HTTPS Required**: See "Camera Not Working on Scanner Page" section above
- Ensure camera permissions are granted in browser settings
- Check that camera is not in use by another application
- Try a different browser (Chrome, Firefox, Safari, Edge)
- Verify you're using a modern browser version
- On mobile: Check app permissions in device settings

### Firebase connection issues
- Verify `.env` variables are correct
- Check Firebase project is active
- Ensure Firestore and Auth are enabled
- Check browser console for specific errors

### QR codes not scanning
- Ensure good lighting
- Hold QR code steady
- Try adjusting distance from camera
- Verify QR code is not damaged or blurry

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ for sports academies worldwide

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

**Note:** This is a production-ready application. Make sure to properly configure Firebase security rules and environment variables before deploying to production.
