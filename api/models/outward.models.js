import { query } from "../db.js";

// ======================
// CREATE OUTWARD ENTRY
// ======================

export async function createOutwardEntry(outward) {
  const result = await query(
    `
    WITH inserted AS (
      INSERT INTO outward_register (
        item_id,
        item_code,
        member_id,
        category,
        unit,
        outward_type,
        purpose,
        work_order_ref,
        qty_used,
        notes,
        project_id,
        canonical_name,
        rate_per_unit
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    ),
    updated AS (
      UPDATE master_inventory
      SET current_stock = current_stock - $9
      WHERE item_id = $1
      RETURNING item_id, current_stock
    )
    SELECT 
      inserted.*,
      updated.current_stock AS updated_stock
    FROM inserted, updated
    `,
    [
      outward.item_id,
      outward.item_code,
      outward.member_id,
      outward.category,
      outward.unit,
      outward.outward_type,
      outward.purpose,
      outward.work_order_ref,
      outward.qty_used,
      outward.notes,
      outward.project_id,
      outward.canonical_name,
      outward.rate_per_unit,
    ],
  );

  return result.rows[0];
}
// ======================
// GET ALL OUTWARD
// ======================

export async function getOutwardEntries() {
  const result = await query(
    `

      SELECT

        o.*,

        p.project_name

      FROM outward_register o

      LEFT JOIN projects p

      ON p.project_id = o.project_id

      ORDER BY o.created_at DESC

      `,
  );

  return result.rows;
}

// ======================
// GET PROJECT OUTWARD
// ======================

export async function getProjectOutward(project_id) {
  const result = await query(
    `

      SELECT *

      FROM outward_register

      WHERE project_id = $1

      ORDER BY created_at DESC

      `,

    [project_id],
  );

  return result.rows;
}
