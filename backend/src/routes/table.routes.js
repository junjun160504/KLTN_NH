import express from "express";
import { createTable, updateTable, listTables } from "../controllers/table.controller.js";

const router = express.Router();

router.post("/", createTable);
router.put("/:id", updateTable);
router.get("/", listTables);

export default router;
