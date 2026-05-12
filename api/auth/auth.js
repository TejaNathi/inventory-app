import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = 'test_secret';

// REGISTER
export async function register(req, res) {
  const { email, full_name, password, department } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO app_users (email, full_name, password_hash, department)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, full_name, hash, department]
  );

  res.json(result.rows[0]);
}

// LOGIN
