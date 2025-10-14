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
    console.log("[Controller] categories:", categories); // 👈 log thêm
    res.status(201).json({ status: 201, data: categories });
  } catch (err) {
    console.error("createMenuCategory error:", err);
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

// Lấy chi tiết món ăn kèm reviews
export async function getMenuItemDetail(req, res) {
  try {
    const { id } = req.params;
    const item = await menuService.getMenuItemDetail(id);
    
    if (!item) {
      return res.status(404).json({ 
        status: 404, 
        message: "Menu item not found" 
      });
    }
    
    res.json({ status: 200, data: item });
  } catch (err) {
    console.error("getMenuItemDetail error:", err);
    res.status(500).json({ 
      status: 500, 
      message: "Internal server error" 
    });
  }
}
