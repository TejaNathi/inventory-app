import express from "express";

import {
  submitRequest,
  getRequests,
  getRequest,
} from "../controllers/request.controller.js";

const router = express.Router();

router.post("/", submitRequest);

router.get("/", getRequests);

router.get("/:id", getRequest);

export default router;
