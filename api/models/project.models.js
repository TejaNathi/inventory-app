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

    VALUES (

      $1,
      $2,
      $3,
      'active',
      NOW(),
      $4

    )

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

        o.item_code,

        o.canonical_name,

        o.category,

        o.unit,

        o.qty_used,

        o.rate_per_unit,

        o.created_at



      FROM projects p



      LEFT JOIN outward_register o

      ON o.project_id = p.project_id



      WHERE o.outward_type = 'wip'



      ORDER BY

        p.project_name,

        o.created_at DESC

      `,
  );

  return result.rows;
}
