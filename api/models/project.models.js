import { query }
from '../db.js';

export async function createProject(
  project
) {

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

      project.notes

    ]

  );

  return result.rows[0];

}



export async function getProjects() {

  const result = await query(

    `
    SELECT *
    FROM projects
    ORDER BY created_at DESC
    `
  );

  return result.rows;

}