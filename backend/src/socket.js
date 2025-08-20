import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/auth/UserModel.js";
import Document from "./models/Document.js";

let io = null;

const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || (socket.handshake.headers?.cookie || "").split("token=")[1];
        if (!token) {
            return next(new Error("Authentication error: No token provided."));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return next(new Error("Authentication error: User not found."));
        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Authentication error: Token is invalid."));
    }
};

export function initializeSocket(server) {
    io = new Server(server, {
        cors: { origin: "http://localhost:5173", credentials: true },
    });

    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        socket.on("get-document", async (documentId) => {
            try {
                const document = await Document.findById(documentId).populate({ path: "history.user", select: "name email" });
                if (!document) return socket.emit("document-error", "Document not found.");

                const hasAccess = document.owner.equals(socket.user._id) || document.collaborators.some((c) => c.equals(socket.user._id));
                if (!hasAccess) return socket.emit("document-error", "Access denied.");

                socket.join(documentId);
                socket.emit("load-document", { data: document.data, history: document.history });

                socket.on("send-changes", (delta) => {
                    socket.broadcast.to(documentId).emit("receive-changes", { delta, user: { _id: socket.user._id, name: socket.user.name } });
                });

                // CORRECTED: This now directly saves the 'data' sent from the client.
                socket.on("save-document", async (data) => {
                    if (hasAccess) {
                        await Document.findByIdAndUpdate(documentId, { data });
                    }
                });
            } catch (err) {
                socket.emit("document-error", "Server error while fetching document.");
            }
        });
    });
}

export { io };