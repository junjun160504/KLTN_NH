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

const router = express.Router();

// QR Generation Routes
router.post("/generate/:tableId", generateQR);           // Generate QR for specific table
router.post("/generate-all", generateAllQRs);            // Generate QR for all active tables

// QR Validation Routes  
router.post("/validate", validateQR);                    // Validate QR URL from request body
router.get("/scan", scanQR);                            // Validate QR from query params (for frontend)

// QR Information Routes
router.get("/info/:tableId", getQRInfo);                // Get QR info for specific table
router.get("/download/:tableId", downloadQRImage);       // Download QR image file

// QR Management Routes
router.delete("/:tableId", deleteQR);                   // Delete QR for specific table

export default router;