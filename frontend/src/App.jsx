import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import UserProvider from './context/UserProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';

import HomePage from './components/pages/HomePage';
import LoginPage from './components/pages/Login';
import RegisterPage from './components/pages/Register';
import TextEditor from './TextEditor';
import ChangePasswordPage from './components/pages/ChangePassword'; // <-- Import the new page

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <UserProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/documents/:id" element={<TextEditor />} />
            <Route path="/change-password" element={<ChangePasswordPage />} /> {/* <-- Add new route */}
          </Route>
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;