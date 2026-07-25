import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';

const StudentProtectedRoute = ({ children }) => {
  const { currentStudent, studentData, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7FB] to-[#FCE4F1]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#EC4899] mx-auto mb-4"></div>
          <p className="text-[#3F3F46] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if student is authenticated but data not loaded yet
  if (currentStudent && !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7FB] to-[#FCE4F1]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#EC4899] mx-auto mb-4"></div>
          <p className="text-[#3F3F46] font-medium">Loading student data...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or no student data, redirect to login
  if (!currentStudent || !studentData) {
    return <Navigate to="/student/login" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
