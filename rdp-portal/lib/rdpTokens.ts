import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET = process.env.RDP_TOKEN_SECRET!;

export function createConnectToken(payload: { udsId: string; userId: string; }) {
  return jwt.sign(payload, SECRET, { expiresIn: "5m" });
}

export function verifyConnectToken(token: string): { udsId: string; userId: string; iat: number; exp: number } {
  const decoded = jwt.verify(token, SECRET) as JwtPayload & { udsId: string; userId: string };
  return { udsId: decoded.udsId, userId: decoded.userId, iat: decoded.iat!, exp: decoded.exp! };
}
