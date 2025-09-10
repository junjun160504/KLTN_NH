import express from 'express';
import { buildVietQrContent } from '../utils/vietqr.js';
import qrcode from 'qrcode';

const router = express.Router();

router.post('/payment/vietqr', async (req, res) => {
    try {
        const { bankBin, accountNumber, merchantName, amount, billCode } = req.body;

        if (!bankBin || !accountNumber || !merchantName || !amount || !billCode) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        const qrContent = buildVietQrContent({
            bankBin,
            accountNumber,
            merchantName: merchantName.toUpperCase().replaceAll(/[^A-Z0-9 ]/g, ''),
            amount,
            billCode,
        });

        const qrCodeBase64 = await qrcode.toDataURL(qrContent);

        res.json({
            message: 'Tạo QR VietQR thành công',
            qrContent,
            qrImage: qrCodeBase64,
        });
    } catch (error) {
        console.error('Lỗi tạo QR VietQR:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo QR' });
    }
});

export default router;
