import { OAuth2Client } from "google-auth-library";
import { env } from "../env";
import jwt from "jsonwebtoken";

export async function getFacebookUserData(accessToken: string) {
  const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;

  const debugTokenURL =
    `https://graph.facebook.com/debug_token?` +
    `input_token=${accessToken}` +
    `&access_token=${appToken}`;

  const debugRes = await fetch(debugTokenURL);
  if (debugRes.status !== 200) throw new Error("Invalid token");

  const debugData = await debugRes.json();
  if (
    !debugData.data.is_valid ||
    debugData.data.app_id !== env.FACEBOOK_APP_ID
  ) {
    throw new Error("Invalid token");
  }

  const userData = await fetch(
    `https://graph.facebook.com/me?` +
      `fields=id,first_name,last_name,email,picture` +
      `&access_token=${accessToken}`,
  );

  if (userData.status !== 200) throw new Error("Invalid token");

  return userData.json();
}

export async function getGoogleUserData(idToken: string) {
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}

export function generateJWTTokens(user: Partial<User>) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, type: "access" },
    env.JWT_SECRET,
    {
      expiresIn: "1h",
      issuer: env.TOKEN_ISSUER,
    },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      type: "refresh",
    },
    env.JWT_SECRET,
    { expiresIn: "7d", issuer: env.TOKEN_ISSUER },
  );

  return { accessToken, refreshToken };
}
