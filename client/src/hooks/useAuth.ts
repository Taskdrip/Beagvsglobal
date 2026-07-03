import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  // Use "returnNull" for 401 so that unauthenticated state (not logged in)
  // resolves cleanly to null rather than throwing an error.  This ensures
  // isLoading settles to false as soon as the server responds, preventing the
  // auth-loading spinner from getting stuck on a 401 response.
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
