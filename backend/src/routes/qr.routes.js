import express from "express";
import {
  generateQR,
  generateAllQRs,
  validateQR,
  getQRInfo,
  downloadQRImage,
  deleteQR,
  scanQR
} from "../controllers/qr.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// QR Generation Routes (Admin only)
router.post("/generate/:tableId", verifyToken, generateQR);           // Generate QR for specific table
router.post("/generate-all", verifyToken, generateAllQRs);            // Generate QR for all active tables

// QR Validation Routes (Public - customer scan)
router.post("/validate", validateQR);                    // Validate QR URL from request body
router.get("/scan", scanQR);                            // Validate QR from query params (for frontend)

// QR Information Routes (Admin only)
router.get("/info/:tableId", verifyToken, getQRInfo);                // Get QR info for specific table
router.get("/download/:tableId", verifyToken, downloadQRImage);       // Download QR image file

// QR Management Routes (Admin only)
router.delete("/:tableId", verifyToken, deleteQR);                   // Delete QR for specific table

export default router;