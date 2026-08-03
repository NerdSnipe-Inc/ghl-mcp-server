import { describe, it, expect } from 'vitest';
import { emailIsvTools } from '../../src/tools/email_isv.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = emailIsvTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_verify_email ────────────────────────────────────────────────────────

describe('ghl_verify_email', () => {
  it('calls POST /email/verify with type and verify parameters', async () => {
    const fetch = mockFetchSuccess({
      result: 'deliverable',
      risk: 'low',
      address: 'test@example.com',
    });
    const result = await getTool('ghl_verify_email').handler(
      {
        type: 'email',
        verify: 'test@example.com',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/email/verify');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.type).toBe('email');
    expect(call.body.verify).toBe('test@example.com');
    expectSuccess(result, {
      result: 'deliverable',
      risk: 'low',
      address: 'test@example.com',
    });
  });

  it('accepts contact type for verification', async () => {
    const fetch = mockFetchSuccess({
      verified: false,
      message: 'Validation is disabled',
    });
    const result = await getTool('ghl_verify_email').handler(
      {
        type: 'contact',
        verify: 'contact-id-123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/email/verify');
    expect(call.body.type).toBe('contact');
    expect(call.body.verify).toBe('contact-id-123');
    expectSuccess(result, {
      verified: false,
      message: 'Validation is disabled',
    });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_verify_email').handler(
      {
        type: 'email',
        verify: 'test@example.com',
      },
      TEST_CONFIG
    );
    expectError(result, 401);
  });
});
