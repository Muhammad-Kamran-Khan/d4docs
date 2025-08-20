import express from 'express';
import { 
  getDocuments,
  createDocument, 
  shareDocument,
  updateDocumentTitle, // <-- Add this import
  deleteDocument       // <-- Add this import
} from '../controllers/documentControllers.js';
import { protect } from '../middleware/authMiddlewares.js'; 

const router = express.Router();

router.get('/documents', protect, getDocuments);
router.post('/documents', protect, createDocument);
router.post('/documents/:documentId/share', protect, shareDocument);
router.patch('/documents/:documentId/title', protect, updateDocumentTitle);
router.delete('/documents/:documentId', protect, deleteDocument);

export default router;