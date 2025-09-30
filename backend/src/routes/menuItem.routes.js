import express from "express";
import { updateMenu, deleteMenu} from "../controllers/menuItem.controller.js";

const router = express.Router();

router.put("/:id", updateMenu);
router.delete("/:id", deleteMenu);


export default router;
