import express from "express";
import { updateMenu, deleteMenu } from "../controllers/menuItem.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/:id", verifyToken, updateMenu);
router.delete("/:id", verifyToken, deleteMenu);


export default router;
