import { query } from "../db.js";

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
    [project.project_name, project.department, project.member_id, project.notes],
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
      WHERE o.outward_type = 'wip'
      ORDER BY p.project_name, o.created_at DESC
      `,
  );

  return result.rows;
}

export async function deleteProject(projectId) {
  await query("DELETE FROM projects WHERE project_id = $1", [projectId]);
  return { ok: true };
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
  const result = await query(
    `
    WITH moved AS (
      DELETE FROM outward_register
      WHERE outward_id = $1
        AND outward_type = 'wip'
      RETURNING item_id, qty_used
    )
    UPDATE master_inventory mi
    SET current_qty = COALESCE(mi.current_qty, 0) + COALESCE(m.qty_used, 0)
    FROM moved m
    WHERE mi.item_id = m.item_id
    RETURNING mi.*
    `,
    [outwardId],
  );

  return result.rows[0] || null;
}
