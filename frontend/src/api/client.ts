const DEFAULT_TIMEOUT_MS = 8000;

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface ApiErrorShape {
  details?: unknown;
  message: string;
  raw?: unknown;
  status: number;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
  query?: QueryParams;
  timeoutMs?: number;
}

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
  const baseUrl = configuredBaseUrl || "/api";

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error implements ApiErrorShape {
  details?: unknown;
  raw?: unknown;
  status: number;

  constructor({ details, message, raw, status }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.details = details;
    this.raw = raw;
    this.status = status;
  }
}

function buildUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  if (/^https?:\/\//.test(API_BASE_URL)) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

function isJsonBody(body: RequestOptions["body"]): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !(body instanceof FormData);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (!responseText) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(responseText) as unknown;
  }

  return responseText;
}

function normalizeErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (detail !== undefined) {
      return `Request failed with status ${status}`;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return `Request failed with status ${status}`;
}

function normalizeError(response: Response, body: unknown): ApiError {
  return new ApiError({
    details: body && typeof body === "object" ? (body as { detail?: unknown }).detail : body,
    message: normalizeErrorMessage(response.status, body),
    raw: body,
    status: response.status,
  });
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, query, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = new Headers(headers);

  if (isJsonBody(body) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      ...init,
      body: isJsonBody(body) ? JSON.stringify(body) : body,
      headers: requestHeaders,
      signal: controller.signal,
    });
    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      throw normalizeError(response, responseBody);
    }

    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        message: "Request timed out",
        status: 408,
      });
    }

    throw new ApiError({
      details: error,
      message: "Unable to reach the API",
      raw: error,
      status: 0,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
