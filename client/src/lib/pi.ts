// Client-side helpers for the Pi Network SDK (loaded globally via client/index.html).
// Docs: https://github.com/pi-apps/pi-platform-docs

declare global {
  interface Window {
    Pi?: {
      init: (opts: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
      createPayment: (
        paymentData: { amount: number; memo: string; metadata: Record<string, any> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: any) => void;
        }
      ) => void;
    };
  }
}

let initialized = false;
// Timestamp of the last successful init() call — used to give the native Pi
// Browser bridge a brief moment to finish its handshake before the very first
// authenticate() call, which otherwise tends to fail on the first attempt.
let initializedAt = 0;

// The Pi SDK script (sdk.minepi.com/pi-sdk.js) is loaded on every page load
// regardless of which browser the user is using — so `window.Pi` existing is
// NOT proof that we're actually inside the native Pi Browser app. Without its
// native messaging bridge, calling authenticate()/createPayment() fails with
// "Pi Network SDK was not initialized." We must also check the user agent,
// which the real Pi Browser app sets to include "PiBrowser".
export function isPiBrowser(): boolean {
  if (typeof window === "undefined" || !window.Pi) return false;
  return /PiBrowser/i.test(window.navigator.userAgent);
}

export function initPiSdk() {
  if (initialized || !isPiBrowser()) return;
  try {
    window.Pi!.init({ version: "2.0", sandbox: import.meta.env.MODE !== "production" });
    initialized = true;
    initializedAt = Date.now();
  } catch (err) {
    // Leave `initialized` false so a later call can retry.
    console.error("[pi] init() failed:", err);
    throw new Error("Could not connect to Pi Network. Please try again.");
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function friendlyPiError(error: any): Error {
  const message = String(error?.message || error || "");
  if (/not initialized/i.test(message)) {
    // Reset so the next attempt re-runs init() from scratch.
    initialized = false;
    return new Error(
      "Pi Network isn't available here. Please open this page inside the official Pi Browser app to sign in with Pi.",
    );
  }
  return error instanceof Error ? error : new Error(message || "Pi Network request failed.");
}

export async function authenticateWithPi(onIncompletePaymentFound: (payment: any) => void) {
  if (!isPiBrowser()) {
    throw new Error("Open this app inside the Pi Browser to use Pi Network sign-in and payments.");
  }

  const wasAlreadyInitialized = initialized;
  initPiSdk();

  // The native Pi Browser bridge needs a brief moment after init() to finish
  // its handshake — calling authenticate() immediately after the very first
  // init() tends to fail with a generic error, even though a retry a moment
  // later succeeds. Give it a short grace period the first time only.
  if (!wasAlreadyInitialized) {
    const elapsed = Date.now() - initializedAt;
    if (elapsed < 600) await sleep(600 - elapsed);
  }

  try {
    return await window.Pi!.authenticate(["username", "payments"], onIncompletePaymentFound);
  } catch (err) {
    // Transient failure right after a fresh init — retry once automatically
    // instead of forcing the user to click the button a second time.
    if (!wasAlreadyInitialized) {
      try {
        await sleep(800);
        return await window.Pi!.authenticate(["username", "payments"], onIncompletePaymentFound);
      } catch (retryErr) {
        throw friendlyPiError(retryErr);
      }
    }
    throw friendlyPiError(err);
  }
}

export function createPiPayment(
  amount: number,
  memo: string,
  metadata: Record<string, any>,
  callbacks: {
    onReadyForServerApproval: (paymentId: string) => void;
    onReadyForServerCompletion: (paymentId: string, txid: string) => void;
    onCancel: (paymentId: string) => void;
    onError: (error: Error, payment?: any) => void;
  }
) {
  if (!isPiBrowser()) {
    throw new Error("Open this app inside the Pi Browser to pay with Pi.");
  }
  try {
    initPiSdk();
    window.Pi!.createPayment({ amount, memo, metadata }, callbacks);
  } catch (err) {
    throw friendlyPiError(err);
  }
}
