import QRCode from "qrcode";

// Hàm build QR VietQR cơ bản (EMVCo)
export function buildVietQR({ accountNumber, bankCode, accountName, amount, addInfo }) {
  // Format VietQR payload
  const payload = `000201010211
26290006${bankCode}01${accountNumber}
520458125303704
540${amount.toFixed(0)}
5802VN
5910${accountName}
62070703${addInfo}
6304`;

  // Sinh QR code image base64
  return QRCode.toDataURL(payload);
}
