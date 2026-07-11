import express from "express";
import { getCMSByKey } from "../controllers/cmsController.js";

const router = express.Router();

router.get("/:key", getCMSByKey);

export default router;
