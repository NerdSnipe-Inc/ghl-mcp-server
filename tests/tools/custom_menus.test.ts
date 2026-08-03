import { describe, it, expect } from 'vitest';
import { customMenuTools } from '../../src/tools/custom_menus.js';
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
  const tool = customMenuTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_custom_menus ────────────────────────────────────────────────────

describe('ghl_get_custom_menus', () => {
  it('calls GET /custom-menus/ with locationId from config', async () => {
    const fetch = mockFetchSuccess({ customMenus: [], totalLinks: 0 });
    const result = await getTool('ghl_get_custom_menus').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/custom-menus/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { customMenus: [], totalLinks: 0 });
  });

  it('passes optional skip, limit, query, showOnCompany', async () => {
    const fetch = mockFetchSuccess({ customMenus: [], totalLinks: 0 });
    await getTool('ghl_get_custom_menus').handler(
      { skip: 10, limit: 5, query: 'dashboard', showOnCompany: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.skip).toBe('10');
    expect(call.params.limit).toBe('5');
    expect(call.params.query).toBe('dashboard');
    expect(call.params.showOnCompany).toBe('true');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_custom_menus').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_custom_menu ─────────────────────────────────────────────────────

describe('ghl_get_custom_menu', () => {
  it('calls GET /custom-menus/{customMenuId}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_custom_menu').handler(
      { customMenuId: 'menu1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/custom-menus/menu1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_custom_menu').handler(
      { customMenuId: 'menu1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_create_custom_menu ──────────────────────────────────────────────────

describe('ghl_create_custom_menu', () => {
  const baseArgs = {
    title: 'Dashboard',
    url: 'https://custom-menus.com/',
    icon: { name: 'yin-yang', fontFamily: 'fas' },
    showOnCompany: true,
    showOnLocation: true,
    showToAllLocations: true,
    openMode: 'iframe',
    locations: [] as string[],
    userRole: 'all',
  };

  it('calls POST /custom-menus/ with all required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_custom_menu').handler(baseArgs, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/custom-menus/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.title).toBe('Dashboard');
    expect(call.body?.url).toBe('https://custom-menus.com/');
    expect(call.body?.icon).toEqual({ name: 'yin-yang', fontFamily: 'fas' });
    expect(call.body?.showOnCompany).toBe(true);
    expect(call.body?.showOnLocation).toBe(true);
    expect(call.body?.showToAllLocations).toBe(true);
    expect(call.body?.openMode).toBe('iframe');
    expect(call.body?.locations).toEqual([]);
    expect(call.body?.userRole).toBe('all');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional allowCamera, allowMicrophone', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_menu').handler(
      { ...baseArgs, allowCamera: true, allowMicrophone: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.allowCamera).toBe(true);
    expect(call.body?.allowMicrophone).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_custom_menu').handler(baseArgs, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_update_custom_menu ──────────────────────────────────────────────────

describe('ghl_update_custom_menu', () => {
  it('calls PUT /custom-menus/{customMenuId} without customMenuId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_custom_menu').handler(
      { customMenuId: 'menu1', title: 'Renamed Menu' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/custom-menus/menu1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.customMenuId).toBeUndefined();
    expect(call.body?.title).toBe('Renamed Menu');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional url, icon, showOnCompany, showOnLocation, showToAllLocations, openMode, locations, userRole, allowCamera, allowMicrophone', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_custom_menu').handler(
      {
        customMenuId: 'menu1',
        url: 'https://new-url.com/',
        icon: { name: 'star' },
        showOnCompany: false,
        showOnLocation: true,
        showToAllLocations: false,
        openMode: 'new_tab',
        locations: ['loc1', 'loc2'],
        userRole: 'admin',
        allowCamera: true,
        allowMicrophone: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.url).toBe('https://new-url.com/');
    expect(call.body?.icon).toEqual({ name: 'star' });
    expect(call.body?.showOnCompany).toBe(false);
    expect(call.body?.showOnLocation).toBe(true);
    expect(call.body?.showToAllLocations).toBe(false);
    expect(call.body?.openMode).toBe('new_tab');
    expect(call.body?.locations).toEqual(['loc1', 'loc2']);
    expect(call.body?.userRole).toBe('admin');
    expect(call.body?.allowCamera).toBe(true);
    expect(call.body?.allowMicrophone).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_update_custom_menu').handler(
      { customMenuId: 'menu1', title: 'Renamed Menu' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_custom_menu ──────────────────────────────────────────────────

describe('ghl_delete_custom_menu', () => {
  it('calls DELETE /custom-menus/{customMenuId}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_custom_menu').handler(
      { customMenuId: 'menu1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/custom-menus/menu1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_custom_menu').handler(
      { customMenuId: 'menu1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
