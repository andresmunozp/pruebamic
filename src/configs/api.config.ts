export const API_CONFIG = {
  WS_URL: import.meta.env.VITE_API_URL_WS || "http://localhost:3000",
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  ENDPOINTS: {
    HEYGEN_TOKEN: "/heygen-access-token",
    LIVEAVATAR_TOKEN: "/liveavatar-access-token",
  },
} as const
