export function isUnauthorizedError(error: Error): boolean {
  // apiRequest's throwIfResNotOk attaches the HTTP status as `.status` and,
  // when the error body is JSON, replaces `.message` with the body's own
  // `message` field (e.g. "Unauthorized") instead of the old raw
  // "401: Unauthorized" text. Check both the structured status and the
  // legacy string format so older/newer error shapes are both recognized.
  if ((error as any)?.status === 401) return true;
  return /^401: .*Unauthorized/.test(error.message);
}