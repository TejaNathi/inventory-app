import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = 'test_secret';

export async function logIn(req, res) {

  const { email, password } = req.body;

  const result = await query(
    `SELECT * FROM app_users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];

  // user not found
  if (!user) {
    return res.status(400).json({
      error: 'User not found'
    });
  }

  // check password
  const valid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!valid) {
    return res.status(400).json({
      error: 'Wrong password'
    });
  }

  // create token
  const token = jwt.sign(

  {

    user_id:
      user.id,

    role:
      user.role,

    department:
      user.department

  },

  JWT_SECRET

);

  // ✅ VERY IMPORTANT
  res.json({
    token,
   user: {

  id:
    user.id,

  email:
    user.email,

  role:
    user.role,

  department:
    user.department

}
  });

}