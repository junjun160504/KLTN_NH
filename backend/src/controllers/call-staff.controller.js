export async function callStaff(req, res) {
    const { table_number, message } = req.body;
    console.log(`⏰ Nhận yêu cầu gọi nhân viên từ bàn ${table_number}: ${message}`);
    res.status(200).json({ status: 200, message: `Nhân viên sẽ tới bàn ${table_number} trong ít phút.` });
}
