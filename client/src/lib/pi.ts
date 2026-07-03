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

export function isPiBrowser(): boolean {
  return typeof window !== "undefined" && !!window.Pi;
}

export function initPiSdk() {
  if (initialized || !isPiBrowser()) return;
  window.Pi!.init({ version: "2.0", sandbox: import.meta.env.MODE !== "production" });
  initialized = true;
}

export async function authenticateWithPi(onIncompletePaymentFound: (payment: any) => void) {
  if (!isPiBrowser()) {
    throw new Error("Open this app inside the Pi Browser to use Pi Network sign-in and payments.");
  }
  initPiSdk();
  return window.Pi!.authenticate(["username", "payments"], onIncompletePaymentFound);
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
  initPiSdk();
  window.Pi!.createPayment({ amount, memo, metadata }, callbacks);
}
