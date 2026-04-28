export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}
