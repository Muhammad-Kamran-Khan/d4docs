import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from '../../context/userContext'; // Adjust path if needed

const ProtectedRoute = () => {
  // 1. Destructure 'loading' (not 'isLoading')
  // 2. Call the custom hook with no arguments
  const { user, loading } = useUserContext();

  // Show a loading indicator while the initial auth check is running
  if (loading) {
    // You can replace this with a proper spinner component
    return <div>Loading...</div>;
  }

  // 3. Check for a specific user property like `._id` for a more reliable check
  return user?._id ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;