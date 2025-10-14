import * as tableQRService from "../services/tableQR.service.js";
import fs from 'fs';
import path from 'path';

/**
 * QR Code Management Controller
 * Handles HTTP requests for QR generation and management
 */

/**
 * Generate QR code for specific table
 * POST /api/qr/generate/:tableId
 */
export async function generateQR(req, res) {
  try {
    const tableId = parseInt(req.params.tableId);

    if (!tableId || isNaN(tableId)) {
      return res.status(400).json({
        status: 400,
        message: "Valid table ID is required"
      });
    }

    const result = await tableQRService.generateTableQR(tableId);

    res.status(200).json({
      status: 200,
      message: "QR code generated successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

/**
 * Generate QR codes for all active tables
 * POST /api/qr/generate-all
 */
export async function generateAllQRs(req, res) {
  try {
    const result = await tableQRService.generateAllTableQRs();

    res.status(200).json({
      status: 200,
      message: `Generated QRs for ${result.successCount}/${result.total} tables`,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

/**
 * Validate QR code
 * POST /api/qr/validate
 * Body: { qrUrl: "https://..." }
 */
export async function validateQR(req, res) {
  try {
    const { qrUrl } = req.body;

    if (!qrUrl) {
      return res.status(400).json({
        status: 400,
        message: "QR URL is required"
      });
    }

    const result = await tableQRService.validateTableQR(qrUrl);

    if (result.valid) {
      res.status(200).json({
        status: 200,
        message: "QR code is valid",
        data: result
      });
    } else {
      res.status(400).json({
        status: 400,
        message: result.error,
        data: { valid: false }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Internal server error during QR validation"
    });
  }
}

/**
 * Get QR information for specific table
 * GET /api/qr/info/:tableId
 */
export async function getQRInfo(req, res) {
  try {
    const tableId = parseInt(req.params.tableId);

    if (!tableId || isNaN(tableId)) {
      return res.status(400).json({
        status: 400,
        message: "Valid table ID is required"
      });
    }

    const result = await tableQRService.getTableQRInfo(tableId);

    res.status(200).json({
      status: 200,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

/**
 * Download QR image for specific table
 * GET /api/qr/download/:tableId
 */
export async function downloadQRImage(req, res) {
  try {
    const tableId = parseInt(req.params.tableId);

    if (!tableId || isNaN(tableId)) {
      return res.status(400).json({
        status: 400,
        message: "Valid table ID is required"
      });
    }

    // Get table QR info to find image path
    const qrInfo = await tableQRService.getTableQRInfo(tableId);

    if (!qrInfo.qrCodeUrl) {
      return res.status(404).json({
        status: 404,
        message: "QR code not found for this table. Generate QR first."
      });
    }

    // Construct full file path
    const filePath = path.join('./public', qrInfo.qrCodeUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 404,
        message: "QR image file not found. Please regenerate QR code."
      });
    }

    // Set headers for file download
    const fileName = `table-${qrInfo.tableNumber}-qr.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Failed to download QR image"
    });
  }
}

/**
 * Delete QR code for specific table
 * DELETE /api/qr/:tableId
 */
export async function deleteQR(req, res) {
  try {
    const tableId = parseInt(req.params.tableId);

    if (!tableId || isNaN(tableId)) {
      return res.status(400).json({
        status: 400,
        message: "Valid table ID is required"
      });
    }

    const result = await tableQRService.deleteTableQR(tableId);

    res.status(200).json({
      status: 200,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

/**
 * Get QR validation from URL parameters (for frontend scanning)
 * GET /api/qr/scan?table=5&session=abc123
 */
export async function scanQR(req, res) {
  try {
    const { table, session } = req.query;

    if (!table || !session) {
      return res.status(400).json({
        status: 400,
        message: "Table ID and session token are required"
      });
    }

    // Construct QR URL for validation
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/menu?table=${table}&session=${session}`;


    const result = await tableQRService.validateTableQR(qrUrl);

    if (result.valid) {
      res.status(200).json({
        status: 200,
        message: "QR scan successful",
        data: {
          valid: true,
          table: result.table,
          sessionToken: result.sessionToken
        }
      });
    } else {
      res.status(400).json({
        status: 400,
        message: result.error,
        data: { valid: false }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "QR scan failed"
    });
  }
}