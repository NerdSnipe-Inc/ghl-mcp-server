/**
 * GoHighLevel API v2 HTTP Client
 *
 * Base URL : https://services.leadconnectorhq.com
 * Auth     : Bearer PIT token + Version: 2021-07-28 header
 * Docs     : https://marketplace.gohighlevel.com/docs/
 */

export const GHL_BASE_URL = "https://services.leadconnectorhq.com";
export const GHL_VERSION = "2021-07-28";

export interface GHLConfig {
  token: string;
  locationId: string;
}

export function getConfig(): GHLConfig {
  const token = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION;

  if (!token) {
    throw new Error(
      "GHL_PIT_TOKEN is not set. Add it to your .env file or MCP server environment config."
    );
  }
  if (!locationId) {
    throw new Error(
      "GHL_LOCATION is not set. Add your sub-account location ID to your .env file or MCP server environment config."
    );
  }

  return { token, locationId };
}

export function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export class GHLApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
    public endpoint: string
  ) {
    super(`GHL API Error ${status} on ${endpoint}: ${statusText}`);
    this.name = "GHLApiError";
  }
}

export async function ghlRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: {
    token: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  }
): Promise<T> {
  const { token, body, params } = options;

  let url = `${GHL_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw new GHLApiError(response.status, response.statusText, errorBody, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/** Format a GHLApiError or generic error into a readable MCP tool response string */
export function formatError(error: unknown): string {
  if (error instanceof GHLApiError) {
    return JSON.stringify(
      {
        error: true,
        status: error.status,
        endpoint: error.endpoint,
        message: error.message,
        details: error.body,
      },
      null,
      2
    );
  }
  if (error instanceof Error) {
    return JSON.stringify({ error: true, message: error.message });
  }
  return JSON.stringify({ error: true, message: String(error) });
}
