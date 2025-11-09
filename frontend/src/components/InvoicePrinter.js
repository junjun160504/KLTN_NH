/**
 * Invoice Printer Component
 * Component để in hóa đơn thanh toán với định dạng nhiệt 80mm
 */

// Thông tin nhà hàng (từ HomesCus.js)
const RESTAURANT_INFO = {
  name: "Nhà hàng Phương Nam",
  address: "Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng",
  phone: "034 811 9773",
  taxCode: "0123456789" // Mã số thuế (có thể thay đổi)
};

/**
 * In hóa đơn thanh toán
 * @param {Object} invoiceData - Dữ liệu hóa đơn
 * @param {string} invoiceData.sessionId - Mã phiên
 * @param {string} invoiceData.tableNumber - Số bàn
 * @param {Array} invoiceData.items - Danh sách món ăn
 * @param {number} invoiceData.totalAmount - Tổng tiền trước thuế
 * @param {number} invoiceData.discount - Giảm giá (điểm tích lũy)
 * @param {number} invoiceData.tax - Thuế VAT
 * @param {number} invoiceData.serviceFee - Phí dịch vụ
 * @param {number} invoiceData.finalAmount - Tổng cộng
 * @param {string} invoiceData.paymentTime - Thời gian thanh toán
 * @param {string} invoiceData.staffName - Tên nhân viên
 */
export const printInvoice = (invoiceData) => {
  // Tạo iframe ẩn để in
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(getInvoiceHTML(invoiceData));
  iframeDoc.close();

  // Trigger print sau khi load xong
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Xóa iframe sau khi in
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
};

/**
 * Generate HTML template cho hóa đơn
 */
const getInvoiceHTML = (invoiceData) => {
  const {
    sessionId,
    tableNumber,
    items = [],
    totalAmount = 0,
    discount = 0,
    finalAmount = 0,
    paymentTime,
    staffName = "Nguyễn Văn A"
  } = invoiceData;

  // Format số tiền
  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString('vi-VN');
  };

  // Format thời gian
  const formattedTime = paymentTime || new Date().toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hóa đơn thanh toán - Bàn ${tableNumber}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          
          body { 
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
          }
          
          @media print {
            body { 
              width: 80mm;
              margin: 0 auto;
            }
          }

          .invoice-container {
            padding: 8px;
            background: white;
          }

          /* Header */
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }

          .restaurant-name {
            font-size: 16px;
            font-weight: 800;
            margin: 4px 0;
            text-transform: uppercase;
          }

          .restaurant-info {
            font-size: 10px;
            margin: 2px 0;
            color: #333;
            font-weight: 600;
          }

          /* Title */
          .invoice-title {
            text-align: center;
            font-size: 14px;
            font-weight: 800;
            margin: 8px 0;
            text-transform: uppercase;
          }

          /* Info section */
          .info-section {
            margin: 8px 0;
            font-size: 11px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }

          .info-label {
            font-weight: 600;
          }

          .info-value {
            font-weight: 700;
            text-align: right;
          }

          /* Items table */
          .items-section {
            margin: 8px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0;
          }

          .items-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            font-weight: 700;
            margin-bottom: 4px;
            font-size: 11px;
          }

          .item-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            margin: 3px 0;
            font-size: 11px;
            font-weight: 600;
          }

          .item-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .item-qty {
            text-align: center;
          }

          .item-price {
            text-align: right;
          }

          /* Summary section */
          .summary-section {
            margin: 8px 0;
            font-size: 12px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }

          .summary-label {
            font-weight: 600;
          }

          .summary-value {
            text-align: right;
            font-weight: 700;
          }

          .summary-total {
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-top: 6px;
            font-size: 14px;
            font-weight: 800;
          }

          /* Footer */
          .footer {
            text-align: center;
            margin-top: 12px;
            border-top: 1px dashed #000;
            padding-top: 8px;
            font-size: 11px;
          }

          .thank-you {
            font-weight: 700;
            margin: 4px 0;
          }

          .come-back {
            font-style: italic;
            margin: 4px 0;
            font-size: 10px;
            font-weight: 600;
          }

          .print-time {
            font-size: 9px;
            color: #666;
            margin-top: 8px;
          }

          /* Spacing utilities */
          .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="restaurant-name">${RESTAURANT_INFO.name}</div>
            <div class="restaurant-info">${RESTAURANT_INFO.address}</div>
            <div class="restaurant-info">SĐT: ${RESTAURANT_INFO.phone}</div>
          </div>

          <!-- Title -->
          <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>

          <!-- Invoice Info -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Bàn:</span>
              <span class="info-value">B${tableNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mã phiên:</span>
              <span class="info-value">#${sessionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Thời gian:</span>
              <span class="info-value">${formattedTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nhân viên:</span>
              <span class="info-value">${staffName}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="items-section">
            <div class="items-header">
              <span>Tên món</span>
              <span class="text-center">SL</span>
              <span class="text-right">Thành tiền</span>
            </div>
            ${items.map(item => `
              <div class="item-row">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">${item.quantity}</span>
                <span class="item-price">${formatMoney(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>

          <!-- Summary -->
          <div class="summary-section">
            ${discount > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Tổng phụ</span>
                <span class="summary-value">${formatMoney(totalAmount)}₫</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Giảm giá</span>
                <span class="summary-value">-${formatMoney(discount)}₫</span>
              </div>
            ` : ''}

            <div class="summary-row summary-total">
              <span class="summary-label">TỔNG CỘNG</span>
              <span class="summary-value">${formatMoney(finalAmount)}₫</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Cảm ơn quý khách!</div>
            <div class="come-back">Hẹn gặp lại!</div>
            <div class="print-time">In lúc: ${formattedTime}</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const InvoicePrinterService = {
  printInvoice
};

export default InvoicePrinterService;
