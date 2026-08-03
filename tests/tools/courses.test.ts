import { describe, it, expect } from 'vitest';
import { courseTools } from '../../src/tools/courses.js';
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
  const tool = courseTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_import_courses ──────────────────────────────────────────────────────

const IMPORT_COURSES_ARGS = {
  products: [
    {
      title: 'Intro to TypeScript',
      description: 'Learn the basics of TypeScript',
      imageUrl: 'https://example.com/ts-course.png',
      categories: [
        {
          title: 'Module 1',
          visibility: 'PUBLIC',
          posts: [
            {
              title: 'Lesson 1: Types',
              description: 'Introduction to types',
            },
          ],
        },
      ],
      instructorDetails: {
        name: 'Jane Doe',
        description: 'TypeScript expert',
      },
    },
  ],
};

describe('ghl_import_courses', () => {
  it('calls POST /courses/courses-exporter/public/import with locationId and products', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_import_courses').handler(IMPORT_COURSES_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/courses/courses-exporter/public/import');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.products).toEqual(IMPORT_COURSES_ARGS.products);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional userId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_import_courses').handler(
      { ...IMPORT_COURSES_ARGS, userId: 'user123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.userId).toBe('user123');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Invalid products data' });
    const result = await getTool('ghl_import_courses').handler(IMPORT_COURSES_ARGS, TEST_CONFIG);
    expectError(result, 400);
  });
});
