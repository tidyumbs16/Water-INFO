// lib/auth.ts

import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// ========================================================================
// Interface for the decoded JWT token payload.
// This defines the structure of the data stored within the token.
// ========================================================================
export interface DecodedToken {
  userId: string;
  email: string; // Added email back, as it's used in previous examples and is a common part of the payload
  role: string;
  iat?: number; // Issued At (Unix timestamp)
  exp?: number; // Expiration Time (Unix timestamp)
}

/**
 * @function verifyToken
 * @description Verifies a given JWT token using the secret key from environment variables.
 * Handles different types of JWT verification errors (expired, invalid).
 * @param {string} token - The JWT string to be verified.
 * @returns {DecodedToken | null} The decoded token payload if verification is successful, otherwise null.
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is NOT defined in environment variables. Cannot verify token.');
      return null;
    }
    // console.log('JWT_SECRET is loaded (length):', secret.length); // For debugging purposes, can be removed in production
    // console.log('Attempting to verify token:', token.substring(0, 30) + '...'); // For debugging purposes, can be removed in production

    const decoded = jwt.verify(token, secret) as DecodedToken;
    // console.log('Token successfully decoded:', decoded); // For debugging purposes, can be removed in production
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

/**
 * @function generateToken
 * @description Generates a JSON Web Token (JWT) for a given payload.
 * This function is used during the login process to issue a token to authenticated users.
 * @param {Omit<DecodedToken, 'iat' | 'exp'>} payload - The data to be encoded in the token (e.g., userId, email, role).
 * @returns {string} The generated JWT string.
 */
export const generateToken = (payload: Omit<DecodedToken, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables. Cannot generate token.');
  }
  // console.log('Generating token with payload:', payload); // For debugging purposes, can be removed in production
  return jwt.sign(payload, secret, { expiresIn: '1h' }); // Using a fixed expiration time of 1 hour
};

/**
 * @function authenticateRequest
 * @description Authenticates an incoming Next.js request by verifying its JWT.
 * This function checks the 'Authorization' header for a 'Bearer' token,
 * verifies the token's signature using `verifyToken`, and checks for expiration.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {NextResponse | DecodedToken} Returns the decoded token payload if authentication is successful,
 * otherwise returns a NextResponse with an appropriate error status.
 */
export function authenticateRequest(request: NextRequest): NextResponse | DecodedToken {
  const authHeader = request.headers.get('Authorization');

  // Check if Authorization header is missing
  if (!authHeader) {
    console.warn('Authentication failed: Missing Authorization header.');
    return NextResponse.json({ message: 'Unauthorized: Missing Authorization header' }, { status: 401 });
  }

  // Split the header to get the token type (Bearer) and the token itself
  const [type, token] = authHeader.split(' ');

  // Validate the format of the Authorization header
  if (type !== 'Bearer' || !token) {
    console.warn('Authentication failed: Invalid Authorization header format.');
    return NextResponse.json({ message: 'Unauthorized: Invalid Authorization header format (Expected "Bearer <token>")' }, { status: 401 });
  }

  // Use the provided verifyToken function to validate the token
  const decoded = verifyToken(token);

  if (!decoded) {
    // verifyToken already logs specific errors (expired, invalid).
    // Here, we just return a generic unauthorized response.
    return NextResponse.json({ message: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }

  console.log('Authentication successful for user:', decoded.userId);
  return decoded; // Return the decoded token if valid
}

/**
 * @function getUserIdFromRequest
 * @description Extracts the user ID from the request's JWT token.
 * This is a convenience function that wraps `authenticateRequest`.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {string | null} The user ID if successfully authenticated, otherwise null.
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const authResult = authenticateRequest(request);
  // If authenticateRequest returns a NextResponse, it means authentication failed.
  if (authResult instanceof NextResponse) {
    return null;
  }
  // Otherwise, authentication was successful, and we can return the userId.
  return authResult.userId || null;
}
