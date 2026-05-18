import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getConfig,
  buildHeaders,
  ghlRequest,
  formatError,
  GHLApiError,
  GHL_BASE_URL,
  GHL_VERSION,
} from '../src/client.js';
import { mockFetchSuccess, mockFetchError } from './helpers.js';

// ── getConfig ─────────────────────────────────────────────────────────────────

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when GHL_PIT_TOKEN is missing', () => {
    delete process.env.GHL_PIT_TOKEN;
    process.env.GHL_LOCATION = 'loc-123';
    expect(() => getConfig()).toThrow('GHL_PIT_TOKEN');
  });

  it('throws when GHL_LOCATION is missing', () => {
    process.env.GHL_PIT_TOKEN = 'tok-abc';
    delete process.env.GHL_LOCATION;
    expect(() => getConfig()).toThrow('GHL_LOCATION');
  });

  it('returns config when both required vars are set', () => {
    process.env.GHL_PIT_TOKEN = 'tok-abc';
    process.env.GHL_LOCATION = 'loc-123';
    const config = getConfig();
    expect(config.token).toBe('tok-abc');
    expect(config.locationId).toBe('loc-123');
  });
});

// ── buildHeaders ──────────────────────────────────────────────────────────────

describe('buildHeaders', () => {
  it('includes Authorization Bearer token', () => {
    const headers = buildHeaders('my-secret-token');
    expect(headers['Authorization']).toBe('Bearer my-secret-token');
  });

  it('includes correct GHL Version header', () => {
    const headers = buildHeaders('tok');
    expect(headers['Version']).toBe(GHL_VERSION);
    expect(headers['Version']).toBe('2021-07-28');
  });

  it('includes JSON Content-Type and Accept', () => {
    const headers = buildHeaders('tok');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });
});

// ── ghlRequest ────────────────────────────────────────────────────────────────

describe('ghlRequest', () => {
  it('builds correct URL from path', async () => {
    const fetch = mockFetchSuccess({ contacts: [] });
    await ghlRequest('GET', '/contacts/', { token: 'tok' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${GHL_BASE_URL}/contacts/`),
      expect.any(Object)
    );
  });

  it('appends query params to URL for GET requests', async () => {
    const fetch = mockFetchSuccess({});
    await ghlRequest('GET', '/contacts/', {
      token: 'tok',
      params: { locationId: 'loc-1', limit: 10, active: true },
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('locationId')).toBe('loc-1');
    expect(parsed.searchParams.get('limit')).toBe('10');
    expect(parsed.searchParams.get('active')).toBe('true');
  });

  it('omits undefined params from URL', async () => {
    const fetch = mockFetchSuccess({});
    await ghlRequest('GET', '/contacts/', {
      token: 'tok',
      params: { locationId: 'loc-1', query: undefined },
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.has('query')).toBe(false);
  });

  it('sends body as JSON for POST requests', async () => {
    const fetch = mockFetchSuccess({ id: '1' });
    await ghlRequest('POST', '/contacts/', {
      token: 'tok',
      body: { firstName: 'Jane', locationId: 'loc-1' },
    });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({
      firstName: 'Jane',
      locationId: 'loc-1',
    });
  });

  it('sends no body for GET requests', async () => {
    const fetch = mockFetchSuccess({});
    await ghlRequest('GET', '/contacts/abc', { token: 'tok' });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeUndefined();
  });

  it('returns empty object for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.reject(new Error('no body')),
    }));
    const result = await ghlRequest('DELETE', '/contacts/abc', { token: 'tok' });
    expect(result).toEqual({});
  });

  it('throws GHLApiError on non-ok response', async () => {
    mockFetchError(404, { message: 'Contact not found' });
    await expect(
      ghlRequest('GET', '/contacts/bad-id', { token: 'tok' })
    ).rejects.toThrow(GHLApiError);
  });

  it('throws GHLApiError with correct status and endpoint', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    try {
      await ghlRequest('GET', '/contacts/', { token: 'bad-tok' });
    } catch (e) {
      expect(e).toBeInstanceOf(GHLApiError);
      expect((e as GHLApiError).status).toBe(401);
      expect((e as GHLApiError).endpoint).toBe('/contacts/');
    }
  });
});

// ── formatError ───────────────────────────────────────────────────────────────

describe('formatError', () => {
  it('formats GHLApiError with status, endpoint, and details', () => {
    const err = new GHLApiError(422, 'Unprocessable Entity', { field: 'email' }, '/contacts/');
    const result = JSON.parse(formatError(err));
    expect(result.error).toBe(true);
    expect(result.status).toBe(422);
    expect(result.endpoint).toBe('/contacts/');
    expect(result.details).toEqual({ field: 'email' });
  });

  it('formats generic Error with message', () => {
    const result = JSON.parse(formatError(new Error('Something went wrong')));
    expect(result.error).toBe(true);
    expect(result.message).toBe('Something went wrong');
  });

  it('formats unknown thrown values as string', () => {
    const result = JSON.parse(formatError('plain string error'));
    expect(result.error).toBe(true);
    expect(result.message).toBe('plain string error');
  });
});
