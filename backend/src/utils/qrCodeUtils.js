import crypto from 'crypto';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/**
 * QR Code Generation Utilities for Table Management
 * 
 * Security approach: tableId + static secret → session token
 * No expiration since QR codes are permanently attached to tables
 */

class QRCodeUtils {
  static SECRET_KEY = process.env.QR_SECRET_KEY || 'restaurant-qr-secret-2024';
  static BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  static QR_STORAGE_PATH = './public/qr';

  /**
   * Generate secure session token for table
   * @param {number} tableId - Table ID from database
   * @returns {string} 16-character session token
   */
  static generateSessionToken(tableId) {
    const rawString = `${tableId}-${this.SECRET_KEY}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');
    return hash.substring(0, 16); // First 16 characters
  }

  /**
   * Validate session token for table
   * @param {number} tableId - Table ID 
   * @param {string} providedToken - Token from QR scan
   * @returns {boolean} True if token is valid
   */
  static validateSessionToken(tableId, providedToken) {
    const expectedToken = this.generateSessionToken(tableId);
    return expectedToken === providedToken;
  }

  /**
   * Generate QR URL for table
   * @param {number} tableId - Table ID
   * @returns {string} Complete QR URL
   */
  static generateQRUrl(tableId) {
    const sessionToken = this.generateSessionToken(tableId);
    return `${this.BASE_URL}/menu?table=${tableId}&session=${sessionToken}`;
  }

  /**
   * Generate QR code image buffer
   * @param {number} tableId - Table ID
   * @param {object} options - QR generation options
   * @returns {Promise<Buffer>} QR image buffer
   */
  static async generateQRBuffer(tableId, options = {}) {
    const qrUrl = this.generateQRUrl(tableId);

    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    try {
      return await QRCode.toBuffer(qrUrl, qrOptions);
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Save QR code image to file system
   * @param {number} tableId - Table ID
   * @param {Buffer} qrBuffer - QR image buffer
   * @returns {string} Relative path to saved image
   */
  static async saveQRImage(tableId, qrBuffer) {
    // Ensure QR storage directory exists
    if (!fs.existsSync(this.QR_STORAGE_PATH)) {
      fs.mkdirSync(this.QR_STORAGE_PATH, { recursive: true });
    }

    const fileName = `table-${tableId}.png`;
    const filePath = path.join(this.QR_STORAGE_PATH, fileName);
    const relativePath = `/qr/${fileName}`;

    try {
      fs.writeFileSync(filePath, qrBuffer);
      return relativePath;
    } catch (error) {
      throw new Error(`Failed to save QR image: ${error.message}`);
    }
  }

  /**
   * Generate and save QR code for table
   * @param {number} tableId - Table ID
   * @param {object} options - QR options
   * @returns {Promise<object>} QR generation result
   */
  static async generateTableQR(tableId, options = {}) {
    try {
      // Generate QR buffer
      const qrBuffer = await this.generateQRBuffer(tableId, options);

      // Save to file system
      const imagePath = await this.saveQRImage(tableId, qrBuffer);

      // Generate QR URL for validation
      const qrUrl = this.generateQRUrl(tableId);
      const sessionToken = this.generateSessionToken(tableId);

      return {
        tableId,
        qrUrl,
        imagePath,
        sessionToken,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`QR generation failed for table ${tableId}: ${error.message}`);
    }
  }

  /**
   * Parse QR URL parameters
   * @param {string} url - Scanned QR URL
   * @returns {object} Parsed parameters
   */
  static parseQRUrl(url) {
    try {
      const urlObj = new URL(url);
      const table = urlObj.searchParams.get('table');
      const session = urlObj.searchParams.get('session');

      return {
        tableId: table ? parseInt(table) : null,
        sessionToken: session,
        isValid: !!(table && session)
      };
    } catch (error) {
      return {
        tableId: null,
        sessionToken: null,
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Validate complete QR data
   * @param {string} url - Scanned QR URL
   * @returns {object} Validation result
   */
  static validateQRData(url) {
    const parsed = this.parseQRUrl(url);

    if (!parsed.isValid) {
      return {
        valid: false,
        error: parsed.error || 'Missing required parameters'
      };
    }

    const isTokenValid = this.validateSessionToken(parsed.tableId, parsed.sessionToken);

    return {
      valid: isTokenValid,
      tableId: parsed.tableId,
      sessionToken: parsed.sessionToken,
      error: isTokenValid ? null : 'Invalid session token'
    };
  }
}

export default QRCodeUtils;