// Pi Network Platform API helper
// Docs: https://github.com/pi-apps/pi-platform-docs
// All server-to-server calls use the App's API Key (PI_API_KEY) issued via the Pi Developer Portal.

const PI_PLATFORM_API_URL = "https://api.minepi.com/v2";

function getApiKey(): string {
  const key = process.env.PI_API_KEY;
  if (!key) {
    throw new Error("PI_API_KEY is not configured. Add it in the environment secrets to enable Pi Network payments.");
  }
  return key;
}

async function piApiRequest(path: string, method: "GET" | "POST", body?: any) {
  const res = await fetch(`${PI_PLATFORM_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Key ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error_message || data?.message || `Pi API error (${res.status})`);
  }
  return data;
}

export async function getPiPayment(paymentId: string) {
  return piApiRequest(`/payments/${paymentId}`, "GET");
}

export async function approvePiPayment(paymentId: string) {
  return piApiRequest(`/payments/${paymentId}/approve`, "POST");
}

export async function completePiPayment(paymentId: string, txid: string) {
  return piApiRequest(`/payments/${paymentId}/complete`, "POST", { txid });
}

export async function cancelPiPayment(paymentId: string) {
  return piApiRequest(`/payments/${paymentId}/cancel`, "POST");
}

// Verify a Pi user's access token by calling the /me endpoint on their behalf.
export async function getPiUser(accessToken: string) {
  const res = await fetch(`${PI_PLATFORM_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // Parse defensively: the Pi Platform API occasionally returns a non-JSON
  // body (HTML error page, empty body) on outages/rate limits. Calling
  // res.json() directly in that case throws an unhandled SyntaxError that
  // surfaces to the user as a cryptic "Unexpected token..." sign-in failure
  // instead of a clear message.
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data?.error_message || `Invalid Pi access token (Pi API returned ${res.status})`);
  }
  if (!data?.uid) {
    throw new Error("Pi Network did not return a valid account. Please try signing in again.");
  }
  return data as { uid: string; username: string };
}
