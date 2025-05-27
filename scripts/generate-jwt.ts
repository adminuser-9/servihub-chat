import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET || 'supersecret';

// Fake user payload (customize this as needed)
const payload = {
  id: 1,
  name: 'Test Agent',
  role: 'AGENT',
};

// Token expires in 7 days
const token = jwt.sign(payload, secret, {
  expiresIn: '7d',
});

console.log('🔐 Dev JWT:\n');
console.log(token);
