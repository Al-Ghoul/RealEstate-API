import { OAuth2Client } from "google-auth-library";
import { env } from "../env";
import jwt from "jsonwebtoken";
import { randomUUIDv7 } from "bun";

export async function getFacebookUserData(
  accessToken: string,
): Promise<FacebookUser> {
  try {
    const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;

    const debugTokenURL = new URL("https://graph.facebook.com/debug_token");
    debugTokenURL.searchParams.set("input_token", accessToken);
    debugTokenURL.searchParams.set("access_token", appToken);

    const debugRes = await fetch(debugTokenURL.toString());
    if (!debugRes.ok) throw new Error("Token validation failed");

    const debugData = (await debugRes.json()) as FacebookDebugTokenResponse;

    if (
      !debugData.data.is_valid ||
      debugData.data.app_id !== env.FACEBOOK_APP_ID
    ) {
      throw new Error("Invalid Facebook token");
    }

    const userDataURL = new URL("https://graph.facebook.com/me");
    userDataURL.searchParams.set(
      "fields",
      "id,first_name,last_name,email,picture",
    );
    userDataURL.searchParams.set("access_token", accessToken);

    const userRes = await fetch(userDataURL.toString());
    if (!userRes.ok) throw new Error("Failed to fetch user data");

    const userData = (await userRes.json()) as FacebookUser;

    if (!userData.id) {
      throw new Error("Invalid user data received");
    }

    return userData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Facebook API error: ${error.message}`);
    }
    throw new Error("Unknown Facebook API error occurred");
  }
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

export function generateJWTTokens(userId: User["id"]) {
  const accessToken = jwt.sign({ token_type: "access" }, env.JWT_SECRET, {
    keyid: randomUUIDv7(),
    issuer: env.TOKEN_ISSUER,
    subject: userId,
    audience: "RealEstate:Mobile",
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ token_type: "refresh" }, env.JWT_SECRET, {
    keyid: randomUUIDv7(),
    issuer: env.TOKEN_ISSUER,
    subject: userId,
    audience: "RealEstate:Mobile",
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}
