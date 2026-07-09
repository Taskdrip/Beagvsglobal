import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
