import { query } from "../db.js";

// ─────────────────────────────────────────────
// FIND EXISTING FAMILY
// ─────────────────────────────────────────────

export async function findInventoryItemByFamily(item) {
  const result = await query(
    `

      SELECT *

      FROM inventory_items

      WHERE

        LOWER(TRIM(department_code))
        =
        LOWER(TRIM($1))

        AND

        LOWER(TRIM(category_code))
        =
        LOWER(TRIM($2))

        AND

        LOWER(TRIM(group_code))
        =
        LOWER(TRIM($3))

      LIMIT 1

      `,

    [item.department_code, item.category_code, item.group_code],
  );

  return result.rows[0];
}

// ─────────────────────────────────────────────
// CREATE INVENTORY FAMILY
// ─────────────────────────────────────────────

export async function createInventoryItem(item) {
  // CHECK IF FAMILY EXISTS

  const existingItem = await findInventoryItemByFamily(item);

  // RETURN EXISTING FAMILY

  if (existingItem) {
    return existingItem;
  }

  // AUTO SERIAL

  const seqResult = await query(
    `

      SELECT nextval(
        'inventory_code_seq'
      ) AS serial

      `,
  );

  const serial = String(seqResult.rows[0].serial).padStart(3, "0");

  // FINAL ITEM CODE

  const item_code = `${serial}-${item.department_code}-${item.category_code}-${
    item.group_code
  }`;

  // INSERT NEW FAMILY

  const result = await query(
    `

      INSERT INTO inventory_items (

        item_code,
        canonical_name,
        department_code,
        category_code,
        group_code

      )

      VALUES (

        $1,
        $2,
        $3,
        $4,
        $5

      )

      RETURNING *

      `,

    [
      item_code,

      // FIRST ITEM NAME
      // becomes canonical

      item.canonical_name,

      item.department_code,

      item.category_code,

      item.group_code,
    ],
  );

  return result.rows[0];
}

// ─────────────────────────────────────────────
// GET INVENTORY ITEMS
// ─────────────────────────────────────────────

export async function getInventoryItems(department_code) {
  console.log("FILTER:", department_code);

  const result = await query(
    `

      SELECT *

      FROM inventory_items

      WHERE LOWER(
        department_code
      ) = LOWER($1)

      ORDER BY item_code

      `,

    [department_code],
  );

  return result.rows;
}

// ─────────────────────────────────────────────
// CREATE ALIAS
// ─────────────────────────────────────────────

export async function createAlias(alias) {
  // CHECK EXISTING ALIAS

  const existingAlias = await query(
    `

      SELECT *

      FROM item_aliases

      WHERE

        item_id = $1

        AND

        LOWER(TRIM(canonical_name))
        =
        LOWER(TRIM($2))

        AND

        LOWER(TRIM(vendor_name))
        =
        LOWER(TRIM($3))

      LIMIT 1

      `,

    [alias.item_id, alias.canonical_name, alias.vendor_name],
  );

  // RETURN EXISTING

  if (existingAlias.rows[0]) {
    return existingAlias.rows[0];
  }

  // CREATE NEW ALIAS

  const result = await query(
    `

      INSERT INTO item_aliases (

        item_id,
        canonical_name,
        vendor_name,
        source

      )

      VALUES (

        $1,
        $2,
        $3,
        $4

      )

      RETURNING *

      `,

    [alias.item_id, alias.canonical_name, alias.vendor_name, alias.source],
  );

  return result.rows[0];
}

// ─────────────────────────────────────────────
// GET ALIASES
// ─────────────────────────────────────────────

export async function getAliasesByItemId(item_id) {
  const result = await query(
    `

      SELECT *

      FROM item_aliases

      WHERE item_id = $1

      ORDER BY canonical_name

      `,

    [item_id],
  );

  return result.rows;
}
