// src/middleware/authMiddleware.js
// This file contains a suite of middleware functions for authentication and authorization.

import asynchandler from "express-async-handler";
// These imports were missing from your 'protect' middleware and are crucial for it to work.
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/auth/UserModel.js";

// Make sure your .env file is loaded.
dotenv.config();

/**
 * @desc Checks for a valid JWT in request cookies and attaches the user object to the request.
 */
export const protect = asynchandler(async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401);
            throw new Error("Not authorized, please login.");
        }

        // Verify the token
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the database
        const user = await User.findById(verified.id).select("-password");

        if (!user) {
            res.status(401);
            throw new Error("User not found.");
        }
        
        // Attach user to the request object
        req.user = user;
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed.");
    }
});

/**
 * @desc Restricts access to a route to users with the 'admin' role.
 * This middleware should be used *after* the 'protect' middleware.
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
export const adminMiddleware = asynchandler(async (req, res, next) => {
    // We can assume `req.user` exists because this middleware follows `protect`.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        throw new Error("Access denied, admin only");
    }
});

/**
 * @desc Restricts access to a route to users with the 'creator' or 'admin' roles.
 * This middleware should be used *after* the 'protect' middleware.
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
export const creatorMiddleware = asynchandler(async (req, res, next) => {
    if (req.user && (req.user.role === "creator") || req.user && (req.user.role === "admin")) {
        next();
    } else {
        res.status(403);
        throw new Error("Only creators can do this!");
    }
});

/**
 * @desc Restricts access to a route to users who have a verified email address.
 * This middleware should be used *after* the 'protect' middleware.
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
export const verifiedMiddleware = asynchandler(async (req, res, next) => {
    if (req.user && req.user.isVerified) {
        next();
    } else {
        res.status(403);
        throw new Error("Please verify your email address!");
    }
});
