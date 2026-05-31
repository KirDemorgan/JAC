// In Docker (Nginx reverse proxy) pass NEXT_PUBLIC_API_BASE="" at build time
// so the browser uses relative paths routed by Nginx.
// In local dev the default is http://localhost:8080.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
