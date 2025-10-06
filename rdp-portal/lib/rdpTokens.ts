import jwt from "jsonwebtoken";

const SECRET = process.env.RDP_TOKEN_SECRET!;

export function createConnectToken(payload: { udsId: string; userId: string; }) {
  return jwt.sign(payload, SECRET, { expiresIn: "5m" });
}

export function verifyConnectToken(token: string): { udsId: string; userId: string; iat: number; exp: number } {
  return jwt.verify(token, SECRET) as any;
}
