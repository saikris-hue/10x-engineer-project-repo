import type { HealthResponse } from "../types/api";

import { request } from "./client";

export function getHealth() {
  return request<HealthResponse>("/health", {
    method: "GET",
  });
}
