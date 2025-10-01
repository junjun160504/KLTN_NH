import express from "express";
import { createTable, updateTable, deleteTable, listTables } from "../controllers/table.controller.js";

const router = express.Router();

router.post("/", createTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);
router.get("/", listTables);

export default router;
