import { query } from '../db.js';

export async function fetchInwardEntries() {

  const result = await query(

    `
    SELECT *

    FROM inward_register

    ORDER BY created_at DESC
    `

  );

  return result.rows;

}