import {
  createCart,
  createLineItems,
  fetchAllCarts,
  fetchCartById,
  updateCartStatus,
  savePayment,
  deleteCartById,
  fetchDeliveryChecklist,
  getAllCanonicalNames,
  createalias,
  createInwardEntries,
} from "../models/cart.models.js";

import { io } from "../server.js";

export async function submitCart(req, res) {
  try {
    const { member_id, source, department, note, total, lineItems } = req.body;
    console.log(req.body.lineItems);

    if (!member_id || !lineItems || lineItems.length === 0) {
      return res.status(400).json({ error: "Invalid cart data" });
    }

    const cart = await createCart({
      member_id,
      source,
      department,
      note,
      total,
      status: "pending",
    });

    await createLineItems(cart.cart_id, lineItems);

    res.json({
      message: "Cart submitted for approval",
      cart_id: cart.cart_id,
    });

    io.to("role:lead").emit(
      "cart:submitted",

      {
        cart_id: cart.cart_id,

        member: cart.member_name,

        total: cart.total,
      },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit cart" });
  }
}

export async function getAllCarts(req, res) {
  try {
    const carts = await fetchAllCarts();

    res.json(carts);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch carts",
    });
  }
}

export async function getCartById(req, res) {
  try {
    const cart = await fetchCartById(req.params.id);

    res.json(cart);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch cart",
    });
  }
}

export async function approveCart(req, res) {
  try {
    const cart = await updateCartStatus(req.params.id, "approved");

    res.json(cart);

    io.to("role:accounts").to("role:member").emit("cart:approved");
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to approve cart",
    });
  }
}

export async function rejectCart(req, res) {
  try {
    const cart = await updateCartStatus(req.params.id, "rejected");

    res.json(cart);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to reject cart",
    });
  }
}

export async function markPaymentDone(req, res) {
  try {
    const { invoice_no, amount_paid } = req.body;

    const cart = await savePayment(req.params.id, invoice_no, amount_paid);
    io.to("role:lead").to("role:member").emit("paymentdone");

    res.json(cart);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to save payment",
    });
  }
}

export async function confirmDelivery(req, res) {
  try {
    const cart = await updateCartStatus(req.params.id, "delivered");

    res.json(cart);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed delivery update",
    });
  }
}

export async function deleteCart(req, res) {
  try {
    await deleteCartById(req.params.id);

    res.json({
      message: "Cart deleted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to delete cart",
    });
  }
}
export async function getDeliveryChecklist(req, res) {
  try {
    const items = await fetchDeliveryChecklist(req.params.id);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
}

export async function fetchAlias(req, res) {
  try {
    const alias = await getAllCanonicalNames(req.query.vendor_name);

    res.json(alias || null);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch alias",
    });
  }
}

export async function addAlias(req, res) {
  try {
    const {
      vendor_name,

      canonical_name,
    } = req.body;

    if (!vendor_name || !canonical_name) {
      return res.status(400).json({
        error: "Missing fields",
      });
    }

    const alias = await createalias({
      vendor_name,

      canonical_name,

      created_by: req.user?.user_id || null,
    });

    res.json(alias);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create alias",
    });
  }
}

export async function createInward(req, res) {
  try {
    const { inwardItems } = req.body;

    if (!inwardItems || !inwardItems.length) {
      return res.status(400).json({
        error: "No inward items",
      });
    }

    const result = await createInwardEntries(inwardItems);

    res.json({
      message: "Inward entries created",

      entries: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed inward entry",
    });
  }
}
