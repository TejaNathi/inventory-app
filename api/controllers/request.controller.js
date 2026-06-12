import {
  createRequest,
  fetchAllRequests,
  fetchRequestById,
  fetchRequestSummaryById,
  saveRequestPayment,
  updateRequestStatus,
} from "../models/request.models.js";

import { io } from "../server.js";

export async function submitRequest(req, res) {
  try {
    const createdRequest = await createRequest(req.body);
    const request = {
      ...(await fetchRequestSummaryById(createdRequest.request_id)),
      payment_type: req.body.payment_type || createdRequest.payment_type,
      status: createdRequest.status || "pending",
    };

    res.json({
      message: "Request submitted",

      request_id: request.request_id,
      request,
    });

    io.to("role:lead").emit("request:submitted", {
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed request",
    });
  }
}

export async function approveRequest(req, res) {
  try {
    const request = await updateRequestStatus(req.params.id, "approved");

    res.json(request);

    io.to("role:accounts").to("role:member").emit("request:approved", {
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to approve request",
    });
  }
}

export async function rejectRequest(req, res) {
  try {
    const request = await updateRequestStatus(req.params.id, "rejected");

    res.json(request);

    io.to("role:member").emit("request:rejected", {
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to reject request",
    });
  }
}

export async function markRequestPaymentDone(req, res) {
  try {
    const request = await saveRequestPayment(req.params.id, req.body);

    res.json(request);

    io.to("role:lead").to("role:member").emit("request:paymentdone", {
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to save request payment",
    });
  }
}

export async function getRequests(req, res) {
  try {
    const requests = await fetchAllRequests();

    res.json(requests);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed fetch",
    });
  }
}

export async function getRequest(req, res) {
  try {
    const request = await fetchRequestById(req.params.id);

    res.json(request);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed fetch",
    });
  }
}
