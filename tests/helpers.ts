import { vi, expect } from 'vitest';
import type { GHLConfig } from '../src/client.js';

// ── Standard test config ──────────────────────────────────────────────────────

export const TEST_CONFIG: GHLConfig = {
  token: 'test-pit-token-abc123',
  locationId: 'test-location-xyz789',
};

export const MOCK_DATA = { id: 'mock-123', success: true };

// ── Fetch mocking ─────────────────────────────────────────────────────────────

export function mockFetchSuccess(data: unknown = MOCK_DATA) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function mockFetchError(status: number, body: unknown = { message: 'API Error' }) {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: statusTexts[status] ?? 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// ── Fetch call inspection ─────────────────────────────────────────────────────

export interface FetchCall {
  url: URL;
  pathname: string;
  params: Record<string, string>;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | undefined;
}

export function parseLastFetchCall(fetchMock: ReturnType<typeof vi.fn>): FetchCall {
  expect(fetchMock).toHaveBeenCalled();
  const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
  const parsedUrl = new URL(url);
  return {
    url: parsedUrl,
    pathname: parsedUrl.pathname,
    params: Object.fromEntries(parsedUrl.searchParams.entries()),
    method: options.method as string,
    headers: options.headers as Record<string, string>,
    body: options.body ? JSON.parse(options.body as string) as Record<string, unknown> : undefined,
  };
}

// ── Result parsing ────────────────────────────────────────────────────────────

export function parseResult(result: string): Record<string, unknown> {
  return JSON.parse(result) as Record<string, unknown>;
}

/** Assert a tool result is a successful JSON payload matching expected data */
export function expectSuccess(result: string, data: unknown = MOCK_DATA) {
  expect(JSON.parse(result)).toEqual(data);
}

/** Assert a tool result is an error payload with the given status */
export function expectError(result: string, status: number) {
  const parsed = parseResult(result);
  expect(parsed.error).toBe(true);
  expect(parsed.status).toBe(status);
}
