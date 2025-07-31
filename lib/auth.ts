// lib/auth.ts
import jwt from 'jsonwebtoken';

export interface DecodedToken {
  role: string;
  userId: string;
  // เพิ่ม properties อื่นๆ ที่คุณคาดหวังใน JWT payload
  // เช่น role: string;
  iat?: number;
  exp?: number;
}

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is NOT defined in environment variables. Cannot verify token.');
      return null;
    }
    console.log('JWT_SECRET is loaded (length):', secret.length); // ตรวจสอบว่า secret ถูกโหลด
    console.log('Attempting to verify token:', token.substring(0, 30) + '...'); // แสดงส่วนแรกของ token

    const decoded = jwt.verify(token, secret) as DecodedToken;
    console.log('Token successfully decoded:', decoded);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT Verification Error: Token Expired. Please log in again.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Verification Error: Invalid Token:', error.message);
    } else {
      console.error('JWT Verification Error: An unexpected error occurred:', error);
    }
    return null;
  }
};

export const generateToken = (payload: DecodedToken): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables. Cannot generate token.');
  }
  console.log('Generating token with payload:', payload);
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};
