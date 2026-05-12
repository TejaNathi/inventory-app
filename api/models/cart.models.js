import { query } from '../db.js';



export async function createCart(cart) {

  const {

    member_id,

    source,

    department,

    note,

    total,

    status = 'pending'

  } = cart;

  const result = await query(

    `
    INSERT INTO cart_requests

    (
      user_id,
      source,
      note,
      total,
      status,
      department
    )

    VALUES

    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )

    RETURNING *
    `,

    [

      member_id,

      source,

      note,

      total,

      status,

      department

    ]

  );

  return result.rows[0];

}
export async function createLineItems(
  cart_id,
  items
) {

  const promises = items.map(item =>

    query(

      `INSERT INTO cart_line_items
       (
         cart_id,
         item_id,
         item_name,
         vendor_name,
         unit_price,
         qty,
         total,
         status
       )

       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         'included'
       )`,

      [

        cart_id,

        item.item_id || null,

        item.item_name,

        item.vendor_name,

        item.unit_price,

        item.qty,

        item.total

      ]

    )

  );
  

  await Promise.all(promises);

}

export async function fetchAllCarts() {

  const result = await query(
    `
    SELECT *
    FROM cart_requests
    ORDER BY created_at DESC
    `
  );

  return result.rows;
}

export async function fetchCartById(cart_id) {

  const cart = await query(
    `
    SELECT *
    FROM cart_requests
    WHERE cart_id = $1
    `,
    [cart_id]
  );

  const items = await query(
    `
    SELECT *
    FROM cart_line_items
    WHERE cart_id = $1
    `,
    [cart_id]
  );

  return {
    cart: cart.rows[0],
    items: items.rows
  };
}

export async function updateCartStatus(cart_id, status) {

  const result = await query(
    `
    UPDATE cart_requests
    SET status = $2
    WHERE cart_id = $1
    RETURNING *
    `,
    [cart_id, status]
  );

  return result.rows[0];
}

export async function savePayment(
  cart_id,
  invoice_no,
  amount_paid
) {

  const result = await query(
    `
    UPDATE cart_requests
    SET
      status = 'paymentdone',
      invoice_no = $2,
      amount_paid = $3,
      payment_date = NOW()
    WHERE cart_id = $1
    RETURNING *
    `,
    [
      cart_id,
      invoice_no,
      amount_paid
    ]
  );

  return result.rows[0];
}

export async function deleteCartById(cart_id) {

  await query(
    `
    DELETE FROM cart_line_items
    WHERE cart_id = $1
    `,
    [cart_id]
  );

  await query(
    `
    DELETE FROM cart_requests
    WHERE cart_id = $1
    `,
    [cart_id]
  );

}


export async function fetchDeliveryChecklist(
  cart_id
) {

  const result = await query(

    `
   SELECT

  cli.line_item_id,

  cli.item_name,

  cli.vendor_name,

  cli.qty,

  cli.unit_price,

  cli.total,

  cr.department,

  cr.invoice_no

FROM cart_line_items cli

LEFT JOIN cart_requests cr
  ON cli.cart_id = cr.cart_id

WHERE cli.cart_id = $1
    `,

    [cart_id]

  );

  return result.rows;

}


export async function getAllCanonicalNames() {

  const result = await query(

    `
    SELECT DISTINCT canonical_name
    FROM item_aliases
    WHERE canonical_name IS NOT NULL
    ORDER BY canonical_name ASC
    `

  );

  return result.rows;

}


export async function createalias({

  vendor_name,

  canonical_name

}) {

  const existing = await query(

    `
    SELECT *
    FROM item_aliases
    WHERE LOWER(canonical_name)
      = LOWER($1)
    LIMIT 1
    `,

    [canonical_name]

  );

  if (existing.rows.length) {

    return existing.rows[0];

  }

  const result = await query(

    `
    INSERT INTO item_aliases (

      vendor_name,

      canonical_name

    )

    VALUES (

      $1,

      $2

    )

    RETURNING *
    `,

    [

      vendor_name,

      canonical_name

    ]

  );

  return result.rows[0];

}


export async function createInwardEntries(
  inwardItems
) {

  const promises = inwardItems.map(

    item =>

      query(

        `
        INSERT INTO inward_register (

          cart_line_id,

          item_name,

          canonical_name,

          qty_received,

          unit,

          rate_per_unit,

          supplier,

          department,
          
          invoice_no,

          category

        )

        VALUES (

          $1,
          $2,
          $3,
          $4,
          'pcs',
          $5,
          $6,
          $7,
          $8,
          $9

        )

        RETURNING *
        `,

        [

          item.cart_line_id,

          item.item_name,

          item.canonical_name,

          item.qty_received,

          item.rate_per_unit,

          item.supplier,

          item.department,

          item.invoice_no,

          item.category

        ]

      )

  );

  const result =
    await Promise.all(promises);

  return result.map(r => r.rows[0]);

}