import pool from "../config/db.js";

export async function addPhone({ phone }) {
  // check trùng số điện thoại
  const [found] = await pool.query("SELECT * FROM customers WHERE phone = ?", [phone]);
  if (found.length > 0) {
    return { idcustomers: found[0].idcustomers, phone: found[0].phone };
  }

  // insert mới
  const [res] = await pool.query("INSERT INTO customers (phone) VALUES (?)", [phone]);
  return { idcustomers: res.insertId, phone };
}

export async function getAllCustomers() {
  const [rows] = await pool.query("SELECT * FROM customers ORDER BY created_at DESC");
  return rows;
}
