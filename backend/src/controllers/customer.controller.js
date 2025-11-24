import * as customerService from "../services/customer.service.js";

/**
 * 🌐 PUBLIC API - Tạo hoặc cập nhật thông tin khách hàng
 * 
 * Use case:
 * - Khách hàng quét QR → nhập số điện thoại (bắt buộc)
 * - Khách hàng có thể thêm email, tên (optional)
 * - Nếu phone đã tồn tại → cập nhật thông tin
 * - Nếu phone mới → tạo customer mới
 * 
 * @route POST /api/customers
 * @access Public
 */
export async function createOrUpdateCustomerController(req, res) {
  try {
    const { name, email, phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({
        status: 400,
        message: "Phone number is required",
      });
    }

    // Validate phone format (Vietnam phone number)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-]/g, ""))) {
      return res.status(400).json({
        status: 400,
        message: "Invalid phone number format",
      });
    }

    // Validate email format (nếu có)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid email format",
        });
      }
    }

    const result = await customerService.createOrUpdateCustomer({ name, email, phone });

    res.status(result.isNew ? 201 : 200).json({
      status: result.isNew ? 201 : 200,
      message: result.isNew ? "Customer created successfully" : "Customer updated successfully",
      data: result.customer,
    });
  } catch (err) {
    console.error("createOrUpdateCustomerController error:", err);

    if (err.message.includes("already exists")) {
      return res.status(409).json({
        status: 409,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Lấy danh sách tất cả khách hàng
 * 
 * @route GET /api/customers
 * @access OWNER, MANAGER
 */
export async function getAllCustomersController(req, res) {
  try {
    const customers = await customerService.getAllCustomers();

    res.status(200).json({
      status: 200,
      message: "Customers retrieved successfully",
      data: {
        total: customers.length,
        customers,
      },
    });
  } catch (err) {
    console.error("getAllCustomersController error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Lấy thông tin chi tiết 1 khách hàng
 * 
 * @route GET /api/customers/:id
 * @access OWNER, MANAGER
 */
export async function getCustomerByIdController(req, res) {
  try {
    const { id } = req.params;

    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (err) {
    console.error("getCustomerByIdController error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🌐 PUBLIC API - Lấy thông tin khách hàng theo phone hoặc email
 * 
 * Use case: Khách hàng kiểm tra điểm thưởng của mình
 * 
 * @route GET /api/customers/me/:identifier
 * @access Public
 */
export async function getCustomerByIdentifierController(req, res) {
  try {
    const { identifier } = req.params;

    let customer;

    // Kiểm tra identifier là phone hay email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(identifier)) {
      customer = await customerService.getCustomerByEmail(identifier);
    } else {
      customer = await customerService.getCustomerByPhone(identifier);
    }

    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (err) {
    console.error("getCustomerByIdentifierController error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Cập nhật thông tin khách hàng
 * 
 * @route PUT /api/customers/:id
 * @access OWNER, MANAGER
 */
export async function updateCustomerController(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Validate email nếu có
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid email format",
        });
      }
    }

    // Validate phone nếu có
    if (phone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-]/g, ""))) {
        return res.status(400).json({
          status: 400,
          message: "Invalid phone number format",
        });
      }
    }

    const updatedCustomer = await customerService.updateCustomerInfo(id, { name, email, phone });

    res.status(200).json({
      status: 200,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (err) {
    console.error("updateCustomerController error:", err);

    if (err.message === "Customer not found") {
      return res.status(404).json({
        status: 404,
        message: err.message,
      });
    }

    if (err.message.includes("already exists")) {
      return res.status(409).json({
        status: 409,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Cập nhật điểm thưởng (Loyalty Points)
 * 
 * Use case:
 * - Admin cộng điểm khi khách hàng order
 * - Admin trừ điểm khi khách đổi quà
 * - Admin set điểm cụ thể (điều chỉnh)
 * 
 * @route PUT /api/customers/:id/points
 * @access OWNER, MANAGER
 */
export async function updateLoyaltyPointsController(req, res) {
  try {
    const { id } = req.params;
    const { points, operation } = req.body;
    const adminId = req.user?.id; // Từ verifyToken middleware

    // Validation
    if (points === undefined || points === null) {
      return res.status(400).json({
        status: 400,
        message: "Points value is required",
      });
    }

    if (typeof points !== "number" || points < 0) {
      return res.status(400).json({
        status: 400,
        message: "Points must be a positive number",
      });
    }

    const validOperations = ["ADD", "SUBTRACT", "SET"];
    const op = operation ? operation.toUpperCase() : "ADD";

    if (!validOperations.includes(op)) {
      return res.status(400).json({
        status: 400,
        message: `Invalid operation. Must be one of: ${validOperations.join(", ")}`,
      });
    }

    const result = await customerService.updateLoyaltyPoints(id, points, op, adminId);

    res.status(200).json({
      status: 200,
      message: "Loyalty points updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("updateLoyaltyPointsController error:", err);

    if (err.message === "Customer not found") {
      return res.status(404).json({
        status: 404,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Lấy lịch sử order của khách hàng
 * 
 * @route GET /api/customers/:id/history
 * @access OWNER, MANAGER
 */
export async function getCustomerOrderHistoryController(req, res) {
  try {
    const { id } = req.params;

    const result = await customerService.getCustomerOrderHistory(id);

    res.status(200).json({
      status: 200,
      message: "Order history retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error("getCustomerOrderHistoryController error:", err);

    if (err.message === "Customer not found") {
      return res.status(404).json({
        status: 404,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🧮 UTILITY - Tính điểm thưởng từ số tiền
 * 
 * Use case: Preview số điểm khách sẽ nhận được
 * 
 * @route POST /api/customers/calculate-points
 * @access Public
 */
export async function calculatePointsController(req, res) {
  try {
    const { orderAmount } = req.body;

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Order amount must be a positive number",
      });
    }

    const points = customerService.calculateLoyaltyPoints(orderAmount);

    res.status(200).json({
      status: 200,
      message: "Points calculated successfully",
      data: {
        orderAmount,
        points,
        formula: "1 point per 10,000 VNĐ",
      },
    });
  } catch (err) {
    console.error("calculatePointsController error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

/**
 * 🔒 ADMIN API - Xóa khách hàng (Soft delete)
 * 
 * @route DELETE /api/customers/:id
 * @access OWNER, MANAGER
 */
export async function deleteCustomerController(req, res) {
  try {
    const { id } = req.params;

    const result = await customerService.deleteCustomer(id);

    res.status(200).json({
      status: 200,
      message: result.message,
      data: { id: result.id }
    });
  } catch (err) {
    console.error("deleteCustomerController error:", err);

    if (err.message === "Customer not found") {
      return res.status(404).json({
        status: 404,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}
