import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, createContext } from "react";
import toast from "react-hot-toast";

const UserContext = createContext();

axios.defaults.withCredentials = true;

export const UserContextProvider = ({ children }) => {
  const serverUrl = "https://d4docs-backend.vercel.app";
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [userState, setUserState] = useState({ name: "", email: "", password: "" });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true); // This is for the initial page load authentication check

  // --- CORE AUTH FUNCTIONS ---

  const getUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/v1/user`);
      setUser(res.data);
    } catch (error) {
      console.error("Could not fetch user details.", error);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const { data: isLoggedIn } = await axios.get(`${serverUrl}/api/v1/login-status`);
        if (isLoggedIn) {
          await getUser();
        }
      } catch (error) {
        console.error("Could not verify login status.");
      } finally {
        setLoading(false); // End loading after the initial check is complete
      }
    };
    checkLoginStatus();
  }, []);

  const registerUser = async (e) => {
    e.preventDefault();
    if (!userState.name || !userState.email || !userState.password) return toast.error("All fields are required.");
    if (userState.password.length < 6) return toast.error("Password must be at least 6 characters.");
    
    const toastId = toast.loading("Registering...");
    try {
      await axios.post(`${serverUrl}/api/v1/register`, userState);
      toast.success("Registration successful!", { id: toastId });
      await getUser();
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.", { id: toastId });
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    if (!userState.email || !userState.password) return toast.error("Email and password are required.");
    
    const toastId = toast.loading("Logging in...");
    try {
      await axios.post(`${serverUrl}/api/v1/login`, { email: userState.email, password: userState.password });
      toast.success("Login successful!", { id: toastId });
      await getUser();
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.", { id: toastId });
    }
  };

  const logoutUser = async () => {
    try {
      await axios.get(`${serverUrl}/api/v1/logout`);
      setUser({});
      toast.success("Logout successful!");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed.");
    }
  };

  // --- USER PROFILE & PASSWORD MANAGEMENT ---

  const updateUser = async (e, formData) => {
    e.preventDefault();
    const toastId = toast.loading("Updating profile...");
    try {
      const res = await axios.patch(`${serverUrl}/api/v1/user`, formData);
      setUser(res.data.user); // The backend returns a nested user object
      toast.success(res.data.message, { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.", { id: toastId });
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const toastId = toast.loading("Changing password...");
    try {
      await axios.patch(`${serverUrl}/api/v1/change-password`, { currentPassword, newPassword });
      toast.success("Password changed successfully.", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.", { id: toastId });
    }
  };

  const forgotPasswordEmail = async (email) => {
    const toastId = toast.loading("Sending reset email...");
    try {
      await axios.post(`${serverUrl}/api/v1/forgot-password`, { email });
      toast.success("Password reset email sent.", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send email.", { id: toastId });
    }
  };

  const resetPassword = async (token, password) => {
    const toastId = toast.loading("Resetting password...");
    try {
      await axios.post(`${serverUrl}/api/v1/reset-password/${token}`, { password });
      toast.success("Password reset successfully!", { id: toastId });
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.", { id: toastId });
    }
  };

  // --- EMAIL VERIFICATION ---

  const emailVerification = async () => {
    const toastId = toast.loading("Sending verification email...");
    try {
      await axios.post(`${serverUrl}/api/v1/verify-email`, {});
      toast.success("Verification email sent.", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send email.", { id: toastId });
    }
  };

  const verifyUser = async (token) => {
    const toastId = toast.loading("Verifying your account...");
    try {
      await axios.post(`${serverUrl}/api/v1/verify-user/${token}`, {});
      toast.success("Account verified successfully!", { id: toastId });
      await getUser();
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed.", { id: toastId });
    }
  };

  // --- ADMIN FUNCTIONS ---
  
  const getAllUsers = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/v1/admin/users`);
      setAllUsers(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    }
  };
  
  const deleteUser = async (id) => {
    const toastId = toast.loading("Deleting user...");
    try {
      await axios.delete(`${serverUrl}/api/v1/admin/users/${id}`);
      toast.success("User deleted successfully.", { id: toastId });
      await getAllUsers(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user.", { id: toastId });
    }
  };
  
  // Effect to fetch all users if the logged-in user is an admin
  useEffect(() => {
    if (user.role === "admin") {
      getAllUsers();
    }
  }, [user.role]);

  // --- FORM INPUT HANDLER ---

  const handlerUserInput = (name) => (e) => {
    setUserState((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        serverUrl,
        userState,
        allUsers, // <-- Added missing export
        handlerUserInput,
        registerUser,
        loginUser,
        logoutUser,
        updateUser,
        changePassword,
        forgotPasswordEmail, // <-- Added missing export
        resetPassword,       // <-- Added missing export
        emailVerification,   // <-- Added missing export
        verifyUser,          // <-- Added missing export
        getAllUsers,         // <-- Added missing export
        deleteUser,          // <-- Added missing export
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};