import Document from "../models/Document.js";
import User from "../models/auth/UserModel.js";
import asynchandler from "express-async-handler";

// GET all documents for a user
export const getDocuments = asynchandler(async (req, res) => {
    const userId = req.user._id;
    const documents = await Document.find({ $or: [{ owner: userId }, { collaborators: userId }] })
        .populate("owner", "name email")
        .sort({ updatedAt: -1 });
    res.status(200).json(documents);
});

// CREATE a blank document
export const createDocument = asynchandler(async (req, res) => {
    const newDoc = await Document.create({ owner: req.user._id, data: { ops: [] } });
    if (newDoc) {
        res.status(201).json({ documentId: newDoc._id });
    } else {
        res.status(400); throw new Error("Invalid document data.");
    }
});

// SHARE a document with a collaborator
export const shareDocument = asynchandler(async (req, res) => {
    const { documentId } = req.params;
    const { collaboratorEmail } = req.body;
    const document = await Document.findById(documentId);
    if (!document) { res.status(404); throw new Error("Document not found"); }
    if (document.owner.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Access denied. Only the owner can share."); }
    const collaborator = await User.findOne({ email: collaboratorEmail });
    if (!collaborator) { res.status(404); throw new Error(`User with email ${collaboratorEmail} not found.`); }
    if (document.collaborators.includes(collaborator._id) || document.owner.equals(collaborator._id)) { res.status(400); throw new Error("User already has access."); }
    document.collaborators.push(collaborator._id);
    await document.save();
    res.status(200).json({ message: `Document shared with ${collaborator.name}.` });
});

export const updateDocumentTitle = asynchandler(async (req, res) => {
    const { documentId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    if (!document) {
        res.status(404);
        throw new Error("Document not found");
    }

    // Check if the user is the owner or a collaborator
    const hasAccess = document.owner.equals(userId) || document.collaborators.some(c => c.equals(userId));
    if (!hasAccess) {
        res.status(403);
        throw new Error("You do not have permission to rename this document.");
    }

    document.title = title;
    await document.save();

    res.status(200).json({ message: "Title updated successfully." });
});

// --- NEW FUNCTION: DELETE DOCUMENT ---
// @desc    Delete a specific document
// @route   DELETE /api/v1/documents/:documentId
// @access  Private (Owner only)
export const deleteDocument = asynchandler(async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    if (!document) {
        res.status(404);
        throw new Error("Document not found");
    }

    // SECURITY: Only the owner of the document can delete it
    if (!document.owner.equals(userId)) {
        res.status(403);
        throw new Error("Access denied. Only the document owner can delete this file.");
    }

    await document.deleteOne();

    res.status(200).json({ message: "Document deleted successfully." });
});