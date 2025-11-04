export async function callStaff(req, res) {
    const { table_number, message } = req.body;
    res.status(200).json({ status: 200, message: `Nhân viên sẽ tới bàn ${table_number} trong ít phút.` });
}
