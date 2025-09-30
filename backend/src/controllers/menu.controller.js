import * as menuService from "../services/menu.service.js";

// Lấy danh sách món (theo tên hoặc all)
export async function getMenuItems(req, res) {
  try {
    const { name } = req.params;
    const items = await menuService.getAllMenuItems(name);
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getMenuItems error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Thêm món mới (admin)
export async function createMenuItem(req, res) {
  try {
    const newItem = await menuService.addMenuItem(req.body);
    res.status(201).json({ status: 201, data: newItem });
  } catch (err) {
    console.error("createMenuItem error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy danh mục món
export async function getMenuCategories(req, res) {
  try {
    const categories = await menuService.getMenuCategories();
    res.status(200).json({ status: 200, data: categories });
  } catch (err) {
    console.error("getMenuCategories error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy món theo category
export async function getItemsByCategory(req, res) {
  try {
    const { id } = req.params;
    const items = await menuService.getItemsByCategory(id);
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getItemsByCategory error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy tất cả món (admin)
export async function getAllItemsController(req, res) {
  try {
    const items = await menuService.getAllItems();
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getAllItemsController error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}
