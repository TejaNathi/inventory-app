import express from "express";

import {
  approveRequest,
  submitRequest,
  getRequests,
  getRequest,
  markRequestPaymentDone,
  rejectRequest,
} from "../controllers/request.controller.js";

const router = express.Router();

router.post("/", submitRequest);

router.get("/", getRequests);

router.patch("/:id/approve", approveRequest);

router.patch("/:id/reject", rejectRequest);

router.patch("/:id/payment", markRequestPaymentDone);

router.get("/:id", getRequest);

export default router;
