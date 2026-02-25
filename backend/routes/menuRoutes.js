import express from "express";
import {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuStatus,
} from "../controllers/menuController.js";

const router = express.Router();

router.get("/menus", getAllMenus);
router.post("/menus", createMenu);
router.put("/menus/:id", updateMenu);
router.delete("/menus/:id", deleteMenu);
router.patch("/menus/:id/toggle", toggleMenuStatus);

export default router;
