/**
 * Build VietQR using VietQR.io API
 * @param {Object} params - Thông tin thanh toán
 * @param {string} params.accountNumber - Số tài khoản
 * @param {string} params.bankCode - Mã ngân hàng (BIN)
 * @param {string} params.accountName - Tên chủ tài khoản
 * @param {number} params.amount - Số tiền
 * @param {string} params.addInfo - Nội dung chuyển khoản
 * @returns {Object} { qrCodeUrl, qrCodeImage, bankInfo }
 */
export async function buildVietQR({ accountNumber, bankCode, accountName, amount, addInfo }) {
  try {
    // Validate input
    if (!accountNumber || !bankCode || !accountName) {
      throw new Error("Thiếu thông tin bắt buộc để tạo VietQR");
    }

    // Chuẩn hóa dữ liệu
    const cleanAccountName = encodeURIComponent(accountName);
    const cleanAddInfo = encodeURIComponent(addInfo);
    const amountValue = Math.round(amount);

    // Build VietQR.io URL
    // Format: https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-compact2.png?amount={AMOUNT}&addInfo={DESCRIPTION}&accountName={ACCOUNT_NAME}
    const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amountValue}&addInfo=${cleanAddInfo}&accountName=${cleanAccountName}`;

    // Return response với đầy đủ thông tin
    return {
      qrCodeUrl,           // URL trực tiếp đến QR image
      qrCodeImage: qrCodeUrl, // Alias for backward compatibility
      bankInfo: {
        accountNumber,
        accountName,
        bankCode,
        amount: amountValue,
        transferContent: addInfo
      },
      // Quick link cho mobile
      quickLink: qrCodeUrl
    };

  } catch (error) {
    console.error("buildVietQR error:", error);
    throw new Error(`Không thể tạo VietQR: ${error.message}`);
  }
}
