import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Pi Browser session token helpers
// Pi Browser's sandboxed WebView does not reliably persist session cookies
// across fetch() calls, so after a Pi login the server issues a bearer token
// that we store in localStorage and attach to every API request.
// ---------------------------------------------------------------------------
export function getPiSessionToken(): string | null {
  try {
    return localStorage.getItem("pi_session_token");
  } catch {
    return null;
  }
}

export function setPiSessionToken(token: string): void {
  try {
    localStorage.setItem("pi_session_token", token);
  } catch {
    // localStorage may be blocked in some browser contexts — fail silently.
  }
}

export function clearPiSessionToken(): void {
  try {
    localStorage.removeItem("pi_session_token");
  } catch {
    // fail silently
  }
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getPiSessionToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const err: any = new Error(`${res.status}: ${text}`);
    err.status = res.status;
    // Most API error responses are JSON ({ message, ...extraFlags }). Parse it
    // and surface both a clean `.message` (without the "404: " status prefix)
    // and the raw `.body` so callers can branch on structured fields like
    // `needsSignup` without string-parsing the error message.
    try {
      const parsed = JSON.parse(text);
      err.body = parsed;
      if (parsed?.message) err.message = parsed.message;
    } catch {
      // Non-JSON error body — keep the default "status: text" message.
    }
    throw err;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = buildAuthHeaders(
    data ? { "Content-Type": "application/json" } : undefined,
  );
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  on404?: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, on404 = "throw" }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If there's a second element and it's an object, treat it as query parameters
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const filters = queryKey[1] as Record<string, string>;
      
      // Add defined parameters to URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    } else if (queryKey.length > 1) {
      // Fallback: join with slashes for simple paths
      url = queryKey.join("/");
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers: buildAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (on404 === "returnNull" && res.status === 404) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      // Refetch when the user returns to the tab so data is never stale
      // after another device or admin changes something.
      refetchOnWindowFocus: true,
      // 30 s gives a good balance: data stays fresh without hammering the
      // server on every keystroke, and mutations + invalidateQueries()
      // always override this for anything that just changed.
      staleTime: 30_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
