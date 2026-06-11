import { pool, query } from "../db.js";

export async function createProject(project) {
  const result = await query(
    `
    INSERT INTO projects (
      project_name,
      department,
      member_id,
      status,
      date,
      notes
    )
    VALUES ($1, $2, $3, 'active', NOW(), $4)
    RETURNING *
    `,
    [
      project.project_name,
      project.department,
      project.member_id,
      project.notes,
    ],
  );

  return result.rows[0];
}

export async function getProjects() {
  const result = await query(
    `
    SELECT *
    FROM projects
    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}

export async function getWIPProjects() {
  const result = await query(
    `
      SELECT
        p.project_id,
        p.project_name,
        p.department,
        p.status,
        o.outward_id,
        o.item_id,
        o.item_code,
        o.canonical_name,
        o.category,
        o.unit,
        o.qty_used,
        o.rate_per_unit,
        o.purpose,
        o.created_at
   FROM projects p
LEFT JOIN outward_register o
  ON o.project_id = p.project_id
  AND o.outward_type = 'wip'      
ORDER BY p.project_name, o.created_at DESC
      `,
  );

  return result.rows;
}

export async function moveWipItemToProject(outwardId, targetProjectId) {
  const result = await query(
    `
    UPDATE outward_register
    SET project_id = $2
    WHERE outward_id = $1
      AND outward_type = 'wip'
    RETURNING *
    `,
    [outwardId, targetProjectId],
  );

  return result.rows[0];
}

export async function returnWipItemToMaster(outwardId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. GET WIP ITEM

    const outwardResult = await client.query(
      `
        SELECT *
        FROM outward_register
        WHERE outward_id = $1
        `,
      [outwardId],
    );

    const outward = outwardResult.rows[0];

    if (!outward) {
      throw new Error("WIP item not found");
    }

    // 2. RETURN STOCK

    const inventoryResult = await client.query(
      `
        UPDATE master_inventory

        SET current_stock =

          COALESCE(current_stock, 0)
          + COALESCE($1, 0)

        WHERE item_id = $2

        RETURNING *
        `,

      [outward.qty_used, outward.item_id],
    );

    // 3. DELETE WIP ENTRY

    await client.query(
      `
      DELETE FROM outward_register
      WHERE outward_id = $1
      `,

      [outwardId],
    );

    await client.query("COMMIT");

    return {
      returnedItem: outward,

      inventory: inventoryResult.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");

    throw err;
  } finally {
    client.release();
  }
}

export async function deleteProject(projectId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // STEP 1 — get all outward items for this project
    const outwardResult = await client.query(
      `SELECT item_id, qty_used
             FROM outward_register
             WHERE project_id = $1`,
      [projectId],
    );

    const outwardItems = outwardResult.rows;
    const updatedItems = [];
    for (const item of outwardItems) {
      await client.query(
        `
    UPDATE master_inventory
    SET current_stock = current_stock + $1
    WHERE item_id = $2
    `,
        [item.qty_used, item.item_id],
      );

      const updatedInventory = await client.query(
        `
    SELECT *
    FROM inventory_view
    WHERE item_id = $1
    `,
        [item.item_id],
      );

      updatedItems.push(updatedInventory.rows[0]);
    }

    // STEP 3 — delete outward entries first
    await client.query(
      `DELETE FROM outward_register
             WHERE project_id = $1`,
      [projectId],
    );

    // STEP 4 — now safe to delete project
    await client.query(
      `DELETE FROM projects
             WHERE project_id = $1`,
      [projectId],
    );

    await client.query("COMMIT");

    return updatedItems;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
