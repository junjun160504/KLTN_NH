import { crc16ccitt } from 'crc';

function tlv(id, value) {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

export function buildVietQrContent({ bankBin, accountNumber, merchantName, amount, billCode }) {
    const pfi = tlv('00', '01');        // Payload Format Indicator
    const poim = tlv('01', '12');       // Point of Initiation Method

    const guid = tlv('00', 'A000000727');  // Napas GUID
    const bank = tlv('00', bankBin);
    const acc = tlv('01', accountNumber);
    const subTemplate = bank + acc;
    const serviceCode = tlv('02', 'QRIBFTTA');
    const mai = tlv('38', guid + subTemplate + serviceCode);

    const mcc = tlv('52', '0000');      // Merchant Category Code
    const currency = tlv('53', '704');  // VND
    const amountField = tlv('54', amount.toString());
    const countryCode = tlv('58', 'VN');
    const merchant = tlv('59', merchantName);
    const bill = tlv('62', tlv('01', billCode));

    // Tổng hợp chuỗi QR chưa có CRC
    let content = pfi + poim + mai + mcc + currency + amountField + countryCode + merchant + bill;

    // Append CRC placeholder
    content += '6304';

    // Tính CRC (CCITT-FALSE)
    const crc = crc16ccitt(Buffer.from(content, 'utf8')).toString(16).toUpperCase().padStart(4, '0');

    return content + crc;
}
