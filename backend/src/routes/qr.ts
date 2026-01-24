import { Router } from "express";
import { validateQR, createQR } from "../controllers/qrController";

const router = Router();

router.post("/validate", validateQR);
router.post("/debug/create", createQR);
// allow GET for convenience when testing from browser
router.get("/debug/create", createQR);

export default router;
