import { query } from "../config/db.js";
import QRCodeUtils from "../utils/qrCodeUtils.js";

/**
 * Table QR Management Service
 * Handles QR code generation, validation, and table updates
 */

/**
 * Generate QR code for specific table
 * @param {number} tableId - Table ID
 * @returns {Promise<object>} QR generation result
 */
export async function generateTableQR(tableId) {
  try {
    // Verify table exists
    const [table] = await query("SELECT * FROM tables WHERE id = ?", [tableId]);
    if (!table) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    if (!table.is_active) {
      throw new Error(`Table ${table.table_number} is not active`);
    }

    // Generate QR code
    const qrResult = await QRCodeUtils.generateTableQR(tableId);

    // Update table with new QR URL
    await query(
      "UPDATE tables SET qr_code_url = ? WHERE id = ?",
      [qrResult.imagePath, tableId]
    );

    return {
      ...qrResult,
      tableNumber: table.table_number,
      tableName: `Bàn ${table.table_number}`
    };
  } catch (error) {
    throw new Error(`Failed to generate QR for table ${tableId}: ${error.message}`);
  }
}

/**
 * Generate QR codes for all active tables
 * @returns {Promise<Array>} Array of QR generation results
 */
export async function generateAllTableQRs() {
  try {
    const tables = await query("SELECT * FROM tables WHERE is_active = true ORDER BY id");

    if (tables.length === 0) {
      throw new Error("No active tables found");
    }

    const results = [];
    const errors = [];

    for (const table of tables) {
      try {
        const qrResult = await generateTableQR(table.id);
        results.push(qrResult);
      } catch (error) {
        errors.push({
          tableId: table.id,
          tableNumber: table.table_number,
          error: error.message
        });
      }
    }

    return {
      success: results,
      errors: errors,
      total: tables.length,
      successCount: results.length,
      errorCount: errors.length
    };
  } catch (error) {
    throw new Error(`Failed to generate QRs for all tables: ${error.message}`);
  }
}

/**
 * Validate QR code and get table information
 * @param {string} qrUrl - Scanned QR URL
 * @returns {Promise<object>} Validation result with table info
 */
export async function validateTableQR(qrUrl) {
  try {
    // Validate QR format and token
    const validation = QRCodeUtils.validateQRData(qrUrl);

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error
      };
    }

    // Get table information from database
    const [table] = await query(
      "SELECT * FROM tables WHERE id = ? AND is_active = true",
      [validation.tableId]
    );

    if (!table) {
      return {
        valid: false,
        error: "Table not found or inactive"
      };
    }

    return {
      valid: true,
      table: {
        id: table.id,
        tableNumber: table.table_number,
        qrCodeUrl: table.qr_code_url,
        isActive: table.is_active
      },
      sessionToken: validation.sessionToken
    };
  } catch (error) {
    return {
      valid: false,
      error: `QR validation failed: ${error.message}`
    };
  }
}

/**
 * Get QR information for specific table
 * @param {number} tableId - Table ID
 * @returns {Promise<object>} Table QR information
 */
export async function getTableQRInfo(tableId) {
  try {
    const [table] = await query("SELECT * FROM tables WHERE id = ?", [tableId]);

    if (!table) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    // Generate current QR URL (for display purposes)
    const qrUrl = QRCodeUtils.generateQRUrl(tableId);
    const sessionToken = QRCodeUtils.generateSessionToken(tableId);

    return {
      tableId: table.id,
      tableNumber: table.table_number,
      qrCodeUrl: table.qr_code_url,
      qrUrl: qrUrl,
      sessionToken: sessionToken,
      isActive: table.is_active,
      hasQRImage: !!table.qr_code_url
    };
  } catch (error) {
    throw new Error(`Failed to get QR info for table ${tableId}: ${error.message}`);
  }
}

/**
 * Delete QR code for table
 * @param {number} tableId - Table ID
 * @returns {Promise<object>} Deletion result
 */
export async function deleteTableQR(tableId) {
  try {
    const [table] = await query("SELECT * FROM tables WHERE id = ?", [tableId]);

    if (!table) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    // Update database to remove QR URL
    await query(
      "UPDATE tables SET qr_code_url = NULL WHERE id = ?",
      [tableId]
    );

    // Note: We're not deleting the physical file to prevent issues
    // if other references exist. File cleanup can be done separately.

    return {
      tableId: tableId,
      tableNumber: table.table_number,
      message: "QR code removed successfully"
    };
  } catch (error) {
    throw new Error(`Failed to delete QR for table ${tableId}: ${error.message}`);
  }
}