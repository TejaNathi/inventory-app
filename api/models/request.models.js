import { query } from "../db.js";

async function getRequestHeaderColumns() {
  const result = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'request_headers'
    `,
  );

  return new Set(result.rows.map((row) => row.column_name));
}

export async function createRequest(requestData) {
  const {
    quotation_no,

    vendor_name,

    member_id,

    payment_type,

    purpose,

    items,
  } = requestData;

  const columns = await getRequestHeaderColumns();
  const insertColumns = ["quotation_no", "vendor_name", "member_id", "purpose"];
  const values = [quotation_no, vendor_name, member_id, purpose];

  if (columns.has("payment_type")) {
    insertColumns.push("payment_type");
    values.push(payment_type || "advance");
  }

  if (columns.has("status")) {
    insertColumns.push("status");
    values.push("pending");
  }

  const headerResult = await query(
    `
      INSERT INTO request_headers (
        ${insertColumns.join(", ")}
      )
      VALUES (
        ${values.map((_, index) => `$${index + 1}`).join(", ")}
      )
      RETURNING *
      `,

    values,
  );

  const request = headerResult.rows[0];

  const promises = items.map((item) =>
    query(
      `
        INSERT INTO request_lines (

          request_id,

          item_name,

          category,

          qty,

          unit,

          rate_per_unit,

          total

        )

        VALUES (

          $1,$2,$3,$4,$5,$6,$7

        )
        `,

      [
        request.request_id,

        item.item_name,

        item.category,

        item.qty,

        item.unit,

        item.rate_per_unit,

        item.qty * item.rate_per_unit,
      ],
    ),
  );

  await Promise.all(promises);

  return request;
}

export async function fetchAllRequests() {
  const result = await query(
    `
      SELECT
        rh.*,
        COUNT(rl.*)::int AS item_count,
        COALESCE(SUM(rl.total), 0)::numeric AS total,
        MIN(rl.item_name) AS first_item_name
      FROM request_headers rh
      LEFT JOIN request_lines rl
        ON rl.request_id = rh.request_id
      GROUP BY rh.request_id
      ORDER BY rh.created_at DESC
      `,
  );

  return result.rows;
}

export async function fetchRequestById(request_id) {
  const header = await query(
    `
      SELECT *
      FROM request_headers

      WHERE request_id = $1
      `,

    [request_id],
  );

  const lines = await query(
    `
      SELECT *
      FROM request_lines

      WHERE request_id = $1
      `,

    [request_id],
  );

  return {
    request: header.rows[0],

    items: lines.rows,
  };
}

export async function fetchRequestSummaryById(request_id) {
  const result = await query(
    `
      SELECT
        rh.*,
        COUNT(rl.*)::int AS item_count,
        COALESCE(SUM(rl.total), 0)::numeric AS total,
        MIN(rl.item_name) AS first_item_name
      FROM request_headers rh
      LEFT JOIN request_lines rl
        ON rl.request_id = rh.request_id
      WHERE rh.request_id = $1
      GROUP BY rh.request_id
    `,
    [request_id],
  );

  return result.rows[0];
}

export async function updateRequestStatus(request_id, status) {
  const columns = await getRequestHeaderColumns();

  if (!columns.has("status")) {
    return fetchRequestSummaryById(request_id);
  }

  const result = await query(
    `
      UPDATE request_headers
      SET status = $2
      WHERE request_id = $1
      RETURNING *
    `,
    [request_id, status],
  );

  return {
    ...(await fetchRequestSummaryById(request_id)),
    ...result.rows[0],
  };
}

export async function saveRequestPayment(request_id, paymentData) {
  const columns = await getRequestHeaderColumns();
  const updates = [];
  const values = [request_id];

  if (columns.has("status")) {
    values.push("paymentdone");
    updates.push(`status = $${values.length}`);
  }

  if (columns.has("invoice_no")) {
    values.push(paymentData.invoice_no);
    updates.push(`invoice_no = $${values.length}`);
  }

  if (columns.has("amount_paid")) {
    values.push(paymentData.amount_paid);
    updates.push(`amount_paid = $${values.length}`);
  }

  if (columns.has("payment_date")) {
    values.push(paymentData.payment_date || new Date());
    updates.push(`payment_date = $${values.length}`);
  }

  if (!updates.length) {
    return fetchRequestSummaryById(request_id);
  }

  const result = await query(
    `
      UPDATE request_headers
      SET ${updates.join(", ")}
      WHERE request_id = $1
      RETURNING *
    `,
    values,
  );

  return {
    ...(await fetchRequestSummaryById(request_id)),
    ...result.rows[0],
  };
}
