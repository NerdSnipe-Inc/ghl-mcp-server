/**
 * GoHighLevel API HTTP Client
 *
 * Base URL : https://services.leadconnectorhq.com
 * Auth     : Bearer PIT token + Version header (v3 preferred, legacy fallback for subset of operations)
 * Docs     : https://marketplace.gohighlevel.com/docs/
 */

export const GHL_BASE_URL = "https://services.leadconnectorhq.com";
/** GHL API v3 — use for every endpoint that has a v3 spec (the default going forward). */
export const GHL_VERSION_V3 = "v3";
/** Legacy GHL API version header — only for the small number of operations with no v3 equivalent yet. */
export const GHL_VERSION_LEGACY = "2021-07-28";

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

export function buildHeaders(token: string, version: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: version,
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
    version: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | string[] | undefined>;
  }
): Promise<T> {
  const { token, version, body, params } = options;

  let url = `${GHL_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, String(item));
        }
      } else {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders(token, version),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Read body once as text, then try to parse as JSON.
    // Avoids "Body already read" errors from calling .json() then .text() on
    // the same consumed stream.
    const text = await response.text();
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = text;
    }
    throw new GHLApiError(response.status, response.statusText, errorBody, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function ghlRequestMultipart<T = unknown>(
  method: "POST",
  path: string,
  options: {
    token: string;
    version: string;
    params?: Record<string, string | number | boolean | undefined>;
    fields: { file: { content: string; filename: string } };
  }
): Promise<T> {
  const { token, version, params, fields } = options;

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

  // Omit Content-Type from buildHeaders' output: fetch sets the correct
  // multipart/form-data boundary automatically when given a FormData body, and an
  // explicit application/json Content-Type would break the multipart request.
  const headers = buildHeaders(token, version);
  delete headers["Content-Type"];

  const formData = new FormData();
  formData.set(
    "file",
    new Blob([fields.file.content], { type: "text/csv" }),
    fields.file.filename
  );

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = text;
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
