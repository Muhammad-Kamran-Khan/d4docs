import express from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    getUser, 
    updateUser, // <--- This one will be updated
    userLoginStatus, 
    verifyEmail, 
    verifyUser, 
    forgetPassword, 
    resetPassword, 
    changePassword
} from "../controllers/auth/userControllers.js";
import { protect } from "../middleware/authMiddlewares.js";
import upload from '../utils/fileUpload.js'; // <-- Import the upload utility

const router = express.Router();

// User routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/user", protect, getUser);

// --- UPDATED ROUTE ---
// This route now uses the 'upload' middleware to handle a single 'photo' file
router.patch("/user", protect, upload.single("photo"), updateUser);

// Other routes
router.get("/login-status", userLoginStatus);
router.post("/verify-email", protect, verifyEmail);
router.post("/verify-user/:verificationToken", verifyUser);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password/:resetPasswordToken", resetPassword);
router.patch("/change-password", protect, changePassword);

export default router;