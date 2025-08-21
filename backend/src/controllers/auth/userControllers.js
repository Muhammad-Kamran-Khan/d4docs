import User from "../../models/auth/UserModel.js";
import generateToken from "../../helpers/generateToken.js";
import asynchandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Token from "../../models/auth/Token.js";
import crypto from "node:crypto";
import hashToken from "../../helpers/hashToken.js";
import sendEmail from "../../helpers/sendEmail.js";
dotenv.config();

// --- REGISTER USER ---
export const registerUser = asynchandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { return res.status(400).json({ message: "All fields are required" }); }
    if (password.length < 6) { return res.status(400).json({ message: "Password must be at least 6 characters" }); }
    const userExists = await User.findOne({ email });
    if (userExists) { return res.status(400).json({ message: "User with that email already exists" }); }
    const user = await User.create({ name, email, password });
    if (!user) { return res.status(400).json({ message: "Invalid user data" }); }
    const token = generateToken(user._id);
    
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sameSite: "none",
        secure: true,
    });

    const { _id, role, photo, bio, isVerified } = user;
    res.status(201).json({ _id, name: user.name, email: user.email, role, photo, bio, isVerified, token });
});

// --- LOGIN USER ---
export const loginUser = asynchandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) { return res.status(400).json({ message: "Please provide an email and password" }); }
    const user = await User.findOne({ email }).select('+password');
    if (!user) { return res.status(400).json({ message: "Invalid credentials" }); }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { return res.status(400).json({ message: "Invalid credentials" }); }
    const token = generateToken(user._id);

    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sameSite: "none",
        secure: true,
    });

    const { _id, name, role, photo, bio, isVerified } = user;
    res.status(200).json({ _id, name, email: user.email, role, photo, bio, isVerified, token });
});

// --- LOGOUT USER ---
export const logoutUser = asynchandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    res.status(200).json({ message: "User logged out successfully" });
});

// --- GET USER ---
export const getUser = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

// --- UPDATE USER (Corrected for File Uploads) ---
export const updateUser = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update name from form data
        user.name = req.body.name || user.name;

        // Check if a file was uploaded by multer
        if (req.file) {
            user.photo = req.file.path; // This is the URL from Cloudinary
        }

        const updatedUser = await user.save();

        // Send back the full user object, excluding password
        res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                photo: updatedUser.photo,
                bio: updatedUser.bio,
                isVerified: updatedUser.isVerified,
            }
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});


export const userLoginStatus = asynchandler(async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json(false);
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        return res.json(!!verified);
    } catch (error) {
        return res.json(false);
    }
});

export const verifyEmail = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
        return res.status(400).json({ message: "User already verified" });
    }

    await Token.findOneAndDelete({ userId: user._id });

    const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;
    const hashedToken = hashToken(verificationToken);

    await new Token({
        userId: user._id,
        verificationToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }).save();

    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    const subject = "Email Verification - Auth2";
    const send_to = user.email;
    const send_from = process.env.USER_EMAIL;

    try {
        await sendEmail(subject, send_to, send_from, "emailVerification", user.name, verificationLink);
        res.status(200).json({ message: "Verification email sent successfully." });
    } catch (error) {
        console.error("Error sending email: ", error);
        res.status(500).json({ message: "Email could not be sent. Please try again later." });
    }
});

export const verifyUser = asynchandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        return res.status(400).json({ message: "Invalid verification token provided." });
    }

    const hashedToken = hashToken(verificationToken);

    const userToken = await Token.findOne({
        verificationToken: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    const user = await User.findById(userToken.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    user.isVerified = true;
    await user.save();
    await userToken.deleteOne();

    res.status(200).json({ message: "User verified successfully." });
});

export const forgetPassword = asynchandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "No user found with that email." });
    }

    await Token.findOneAndDelete({ userId: user._id });

    const passwordResetToken = crypto.randomBytes(64).toString("hex") + user._id;
    const hashedToken = hashToken(passwordResetToken);

    await new Token({
        userId: user._id,
        passwordResetToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000,
    }).save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${passwordResetToken}`;

    const subject = "Password Reset - Auth2";
    const send_to = user.email;
    const send_from = process.env.USER_EMAIL;

    try {
        await sendEmail(subject, send_to, send_from, "forgotPassword", user.name, resetLink);
        res.status(200).json({ message: "Password reset email sent successfully." });
    } catch (error) {
        console.error("Error sending email: ", error);
        res.status(500).json({ message: "Email could not be sent. Please try again later." });
    }
});


export const resetPassword = asynchandler(async (req, res) => {
    const { resetPasswordToken } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Please provide a valid password (min 6 characters)." });
    }

    const hashedToken = hashToken(resetPasswordToken);

    const userToken = await Token.findOne({
        passwordResetToken: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const user = await User.findById(userToken.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    user.password = password;
    await user.save();
    await userToken.deleteOne();

    res.status(200).json({ message: "Password reset successfully." });
});

export const changePassword = asynchandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) { return res.status(400).json({ message: "Please provide valid passwords." }); }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) { return res.status(404).json({ message: "User not found." }); }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) { return res.status(400).json({ message: "Incorrect current password." }); }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully." });
});