import { query } from "../db.js";

export async function createRequest(requestData) {
  const {
    quotation_no,

    vendor_name,

    member_id,

    purpose,

    items,
  } = requestData;

  const headerResult = await query(
    `
      INSERT INTO request_headers (

        quotation_no,
        vendor_name,
        member_id,
        purpose

      )

      VALUES (

        $1,$2,$3,$4

      )

      RETURNING *
      `,

    [quotation_no, vendor_name, member_id, purpose],
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
      SELECT *
      FROM request_headers

      ORDER BY
      created_at DESC
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
