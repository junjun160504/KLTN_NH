import * as customerService from "../services/customer.service.js";

export async function addCustomer(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ status: 400, message: "Thiếu số điện thoại" });
    }

    const result = await customerService.addPhone({ phone });
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("addCustomer error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

export async function getCustomers(req, res) {
  try {
    const customers = await customerService.getAllCustomers();
    res.status(200).json({ status: 200, data: customers });
  } catch (err) {
    console.error("getCustomers error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}
