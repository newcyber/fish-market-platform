import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleSheetsValuesResponse {
  range?: string;
  majorDimension?: string;
  values?: string[][];
}

interface GoogleSpreadsheetResponse {
  spreadsheetId?: string;
  properties?: {
    title?: string;
  };
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
      index?: number;
    };
  }>;
}

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getCredentials(): ServiceAccountCredentials {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (json) {
    let parsed: {
      client_email?: unknown;
      private_key?: unknown;
    };

    try {
      parsed = JSON.parse(json) as {
        client_email?: unknown;
        private_key?: unknown;
      };
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON tidak berisi JSON yang valid.",
      );
    }

    if (
      typeof parsed.client_email !== "string" ||
      typeof parsed.private_key !== "string"
    ) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON harus memiliki client_email dan private_key.",
      );
    }

    return {
      clientEmail: parsed.client_email.trim(),
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();

  const privateKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      ?.replace(/\\n/g, "\n")
      .trim();

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Credential Google belum dikonfigurasi. Isi GOOGLE_SERVICE_ACCOUNT_JSON atau GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  return {
    clientEmail,
    privateKey,
  };
}

function getAccessTokenFromCache(): string | null {
  if (!cachedToken) {
    return null;
  }

  if (Date.now() >= cachedToken.expiresAt) {
    cachedToken = null;
    return null;
  }

  return cachedToken.accessToken;
}

async function getAccessToken(): Promise<string> {
  const cached = getAccessTokenFromCache();

  if (cached) {
    return cached;
  }

  const credentials = getCredentials();

  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );

  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const unsignedToken = `${header}.${claimSet}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(credentials.privateKey, "base64url");
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Gagal mendapatkan access token Google (${response.status}). ${body.slice(0, 500)}`,
    );
  }

  const token =
    (await response.json()) as GoogleTokenResponse;

  if (!token.access_token) {
    throw new Error(
      "Google tidak mengembalikan access token.",
    );
  }

  cachedToken = {
    accessToken: token.access_token,
    expiresAt:
      Date.now() +
      Math.max(60, token.expires_in - 120) * 1000,
  };

  return token.access_token;
}

export function isGoogleSheetsCredentialConfigured(): boolean {
  try {
    getCredentials();
    return true;
  } catch {
    return false;
  }
}

export async function listGoogleSheets(input: {
  spreadsheetId: string;
}): Promise<Array<{ sheetId: number; title: string; index: number }>> {
  const spreadsheetId = input.spreadsheetId.trim();

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID wajib diisi.");
  }

  const accessToken = await getAccessToken();

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${encodeURIComponent(spreadsheetId)}` +
    `?fields=spreadsheetId,properties(title),sheets(properties(sheetId,title,index))`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google Sheets API gagal (${response.status}). ${body.slice(0, 800)}`,
    );
  }

  const data = (await response.json()) as GoogleSpreadsheetResponse;

  return (data.sheets ?? [])
    .map((sheet) => sheet.properties)
    .filter(
      (properties): properties is { sheetId: number; title: string; index?: number } =>
        typeof properties?.sheetId === "number" &&
        typeof properties.title === "string" &&
        properties.title.trim().length > 0,
    )
    .map((properties) => ({
      sheetId: properties.sheetId,
      title: properties.title.trim(),
      index: properties.index ?? 0,
    }))
    .sort((a, b) => a.index - b.index);
}

export async function readGoogleSheetValues(input: {
  spreadsheetId: string;
  range: string;
}): Promise<string[][]> {
  const spreadsheetId = input.spreadsheetId.trim();
  const range = input.range.trim();

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID wajib diisi.");
  }

  if (!range) {
    throw new Error("Range Google Sheets wajib diisi.");
  }

  const accessToken = await getAccessToken();

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${encodeURIComponent(spreadsheetId)}/values/` +
    `${encodeURIComponent(range)}?majorDimension=ROWS`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Google Sheets API gagal (${response.status}). ${body.slice(0, 800)}`,
    );
  }

  const data =
    (await response.json()) as GoogleSheetsValuesResponse;

  return Array.isArray(data.values)
    ? data.values
    : [];
}

export default {
  isGoogleSheetsCredentialConfigured,
  readGoogleSheetValues,
  listGoogleSheets,
};
