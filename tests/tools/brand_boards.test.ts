import { describe, it, expect } from 'vitest';
import { brandBoardTools } from '../../src/tools/brand_boards.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = brandBoardTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_brand_board ──────────────────────────────────────────────────

describe('ghl_create_brand_board', () => {
  it('calls POST /brand-boards/ with name and locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_brand_board').handler(
      { name: 'My Brand Board' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/brand-boards/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('My Brand Board');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional logos, colors, fonts, default, brandBoardId, parentId, type, url', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const logos = [{ url: 'https://x.com/logo.png', label: 'Primary', path: '/logos/logo.png' }];
    const colors = [{ hexa: '#FF5733FF', rgba: 'rgba(255,87,51,1)', hex: '#FF5733', rgb: 'rgb(255,87,51)', label: 'Orange' }];
    const fonts = [{ font: 'Montserrat', fallback: 'sans-serif', label: 'Heading' }];
    await getTool('ghl_create_brand_board').handler(
      {
        name: 'My Brand Board',
        logos,
        colors,
        fonts,
        default: true,
        brandBoardId: 'src-board-1',
        parentId: 'folder-1',
        type: 'blank',
        url: 'https://example.com',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.logos).toEqual(logos);
    expect(call.body?.colors).toEqual(colors);
    expect(call.body?.fonts).toEqual(fonts);
    expect(call.body?.default).toBe(true);
    expect(call.body?.brandBoardId).toBe('src-board-1');
    expect(call.body?.parentId).toBe('folder-1');
    expect(call.body?.type).toBe('blank');
    expect(call.body?.url).toBe('https://example.com');
  });

  it('rejects incomplete logo/color/font shapes', () => {
    const schema = getTool('ghl_create_brand_board').inputSchema;
    expect(
      schema.safeParse({ name: 'x', logos: [{ url: 'https://x.com/logo.png' }] }).success
    ).toBe(false); // missing label/path
    expect(
      schema.safeParse({ name: 'x', colors: [{ hexa: '#FFF' }] }).success
    ).toBe(false); // missing rgba/hex/rgb/label
    expect(
      schema.safeParse({ name: 'x', fonts: [{ font: 'Arial' }] }).success
    ).toBe(false); // missing fallback/label
    expect(
      schema.safeParse({
        name: 'x',
        logos: [{ url: 'https://x.com/logo.png', label: 'Primary', path: '/logo.png' }],
        colors: [{ hexa: '#FFF', rgba: 'rgba(1,1,1,1)', hex: '#FFF', rgb: 'rgb(1,1,1)', label: 'White' }],
        fonts: [{ font: 'Arial', fallback: 'sans-serif', label: 'Body' }],
      }).success
    ).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_brand_board').handler(
      { name: 'My Brand Board' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_brand_boards ─────────────────────────────────────────────────────

describe('ghl_get_brand_boards', () => {
  it('calls GET /brand-boards/{locationId}', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    const result = await getTool('ghl_get_brand_boards').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/brand-boards/${TEST_CONFIG.locationId}`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { data: [], total: 0 });
  });

  it('passes optional limit, offset, search, deleted', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    await getTool('ghl_get_brand_boards').handler(
      { limit: 10, offset: 0, search: 'My Board', deleted: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('0');
    expect(call.params.search).toBe('My Board');
    expect(call.params.deleted).toBe('true');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_brand_boards').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_brand_board ──────────────────────────────────────────────────────

describe('ghl_get_brand_board', () => {
  it('calls GET /brand-boards/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_brand_board').handler({ id: 'board1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/brand-boards/${TEST_CONFIG.locationId}/board1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_brand_board').handler({ id: 'board1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_update_brand_board ───────────────────────────────────────────────────

describe('ghl_update_brand_board', () => {
  it('calls PATCH /brand-boards/{locationId}/{id} without id in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_brand_board').handler(
      { id: 'board1', name: 'Renamed Board' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe(`/brand-boards/${TEST_CONFIG.locationId}/board1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.name).toBe('Renamed Board');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional logos, colors, fonts, default, parentId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const logos = [{ url: 'https://x.com/logo.png', label: 'Primary', path: '/logos/logo.png' }];
    await getTool('ghl_update_brand_board').handler(
      { id: 'board1', logos, colors: [], fonts: [], default: false, parentId: 'folder-2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.logos).toEqual(logos);
    expect(call.body?.colors).toEqual([]);
    expect(call.body?.fonts).toEqual([]);
    expect(call.body?.default).toBe(false);
    expect(call.body?.parentId).toBe('folder-2');
  });

  it('rejects incomplete logo/color/font shapes', () => {
    const schema = getTool('ghl_update_brand_board').inputSchema;
    expect(
      schema.safeParse({ id: 'board1', logos: [{ url: 'https://x.com/logo.png' }] }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        id: 'board1',
        colors: [{ hexa: '#FFF', rgba: 'rgba(1,1,1,1)', hex: '#FFF', rgb: 'rgb(1,1,1)', label: 'White' }],
      }).success
    ).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_update_brand_board').handler(
      { id: 'board1', name: 'Renamed Board' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_brand_board ───────────────────────────────────────────────────

describe('ghl_delete_brand_board', () => {
  it('calls DELETE /brand-boards/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_brand_board').handler({ id: 'board1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/brand-boards/${TEST_CONFIG.locationId}/board1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_brand_board').handler({ id: 'board1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_get_brand_voices ─────────────────────────────────────────────────────

describe('ghl_get_brand_voices', () => {
  it('calls GET /brand-boards/locations/{locationId}/brand-voices', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    const result = await getTool('ghl_get_brand_voices').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { data: [], total: 0 });
  });

  it('passes optional limit, offset, search, deleted', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    await getTool('ghl_get_brand_voices').handler(
      { limit: 20, offset: 10, search: 'Acme', deleted: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('20');
    expect(call.params.offset).toBe('10');
    expect(call.params.search).toBe('Acme');
    expect(call.params.deleted).toBe('false');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_get_brand_voices').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_create_brand_voice ───────────────────────────────────────────────────

describe('ghl_create_brand_voice', () => {
  it('calls POST /brand-boards/locations/{locationId}/brand-voices with type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_brand_voice').handler({ type: 'manual' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.type).toBe('manual');
    expect(call.body?.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional name, url, description, answers', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const answers = { brandName: 'Acme Inc', toneOfVoice: 'Professional and friendly' };
    await getTool('ghl_create_brand_voice').handler(
      { type: 'manual', name: 'My Brand Voice', url: 'https://example.com', description: 'A tech company', answers },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.name).toBe('My Brand Voice');
    expect(call.body?.url).toBe('https://example.com');
    expect(call.body?.description).toBe('A tech company');
    expect(call.body?.answers).toEqual(answers);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_brand_voice').handler({ type: 'manual' }, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_get_brand_voice ──────────────────────────────────────────────────────

describe('ghl_get_brand_voice', () => {
  it('calls GET /brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_brand_voice').handler(
      { brandVoiceId: 'voice1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices/voice1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_brand_voice').handler({ brandVoiceId: 'voice1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_update_brand_voice ───────────────────────────────────────────────────

describe('ghl_update_brand_voice', () => {
  it('calls PATCH /brand-boards/locations/{locationId}/brand-voices/{brandVoiceId} without brandVoiceId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_brand_voice').handler(
      { brandVoiceId: 'voice1', name: 'Renamed Voice' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe(`/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices/voice1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.brandVoiceId).toBeUndefined();
    expect(call.body?.name).toBe('Renamed Voice');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional answers', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const answers = { brandName: 'Brand Name', toneOfVoice: 'Friendly' };
    await getTool('ghl_update_brand_voice').handler(
      { brandVoiceId: 'voice1', answers },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.answers).toEqual(answers);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_update_brand_voice').handler(
      { brandVoiceId: 'voice1', name: 'Renamed Voice' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_brand_voice ───────────────────────────────────────────────────

describe('ghl_delete_brand_voice', () => {
  it('calls DELETE /brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_brand_voice').handler(
      { brandVoiceId: 'voice1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices/voice1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_brand_voice').handler({ brandVoiceId: 'voice1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_set_default_brand_voice ──────────────────────────────────────────────

describe('ghl_set_default_brand_voice', () => {
  it('calls POST /brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}/default', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_set_default_brand_voice').handler(
      { brandVoiceId: 'voice1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/brand-boards/locations/${TEST_CONFIG.locationId}/brand-voices/voice1/default`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_set_default_brand_voice').handler(
      { brandVoiceId: 'voice1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
