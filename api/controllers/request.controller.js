import {
  createRequest,
  fetchAllRequests,
  fetchRequestById,
} from "../models/request.models.js";

export async function submitRequest(req, res) {
  try {
    const request = await createRequest(req.body);

    res.json({
      message: "Request submitted",

      request_id: request.request_id,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed request",
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
