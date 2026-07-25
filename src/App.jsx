import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { StudentAuthProvider } from './student/contexts/StudentAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentProtectedRoute from './student/components/StudentProtectedRoute';
import MainLayout from './layouts/MainLayout';
import StudentLayout from './student/layouts/StudentLayout';

// Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Groups from './pages/Groups';
import Scanner from './pages/Scanner';
import Attendance from './pages/Attendance';
import SessionMaterials from './pages/SessionMaterials';

// Student Pages
import StudentLogin from './student/pages/StudentLogin';
import StudentDashboard from './student/pages/StudentDashboard';
import StudentProfile from './student/pages/StudentProfile';
import StudentAttendance from './student/pages/StudentAttendance';
import StudentMaterials from './student/pages/StudentMaterials';

function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
    <AuthProvider>
      <StudentAuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--modal-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(236, 72, 153, 0.18)',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: "'Poppins', system-ui, sans-serif",
                padding: '12px 16px',
              },
              success: {
                duration: 3000,
                iconTheme: { primary: '#22C55E', secondary: '#fff' },
              },
              error: {
                duration: 4000,
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
          <Routes>
            {/* Admin Routes */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="students" element={<Students />} />
                      <Route path="groups" element={<Groups />} />
                      <Route path="scanner" element={<Scanner />} />
                      <Route path="attendance" element={<Attendance />} />
                      <Route path="materials" element={<SessionMaterials />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route
              path="/student/*"
              element={
                <StudentProtectedRoute>
                  <StudentLayout>
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="profile" element={<StudentProfile />} />
                      <Route path="attendance" element={<StudentAttendance />} />
                      <Route path="materials" element={<StudentMaterials />} />
                      <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
                    </Routes>
                  </StudentLayout>
                </StudentProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </StudentAuthProvider>
    </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
