import { describe, it, expect } from 'vitest';
import { blogTools } from '../../src/tools/blogs.js';
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
  const tool = blogTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_blog_authors ────────────────────────────────────────────────────

describe('ghl_get_blog_authors', () => {
  it('calls GET /blogs/authors with locationId, limit, offset', async () => {
    const fetch = mockFetchSuccess({ authors: [] });
    const result = await getTool('ghl_get_blog_authors').handler(
      { limit: 10, offset: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/blogs/authors');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('0');
    expectSuccess(result, { authors: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_blog_authors').handler({ limit: 10, offset: 0 }, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_blog_categories ─────────────────────────────────────────────────

describe('ghl_get_blog_categories', () => {
  it('calls GET /blogs/categories with locationId, limit, offset', async () => {
    const fetch = mockFetchSuccess({ categories: [] });
    const result = await getTool('ghl_get_blog_categories').handler(
      { limit: 20, offset: 5 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/blogs/categories');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.limit).toBe('20');
    expect(call.params.offset).toBe('5');
    expectSuccess(result, { categories: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_get_blog_categories').handler({ limit: 20, offset: 5 }, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_get_blogs ────────────────────────────────────────────────────────────

describe('ghl_get_blogs', () => {
  it('calls GET /blogs/site/all with locationId, skip, limit', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    const result = await getTool('ghl_get_blogs').handler(
      { skip: 0, limit: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/blogs/site/all');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('10');
    expectSuccess(result, { data: [] });
  });

  it('passes optional searchTerm', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    await getTool('ghl_get_blogs').handler(
      { skip: 0, limit: 10, searchTerm: 'travel' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.searchTerm).toBe('travel');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_blogs').handler({ skip: 0, limit: 10 }, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_blog_posts ───────────────────────────────────────────────────────

describe('ghl_get_blog_posts', () => {
  it('calls GET /blogs/posts/all with locationId, blogId, limit, offset', async () => {
    const fetch = mockFetchSuccess({ blogs: [] });
    const result = await getTool('ghl_get_blog_posts').handler(
      { blogId: 'blog1', limit: 10, offset: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/blogs/posts/all');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.blogId).toBe('blog1');
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('0');
    expectSuccess(result, { blogs: [] });
  });

  it('passes optional searchTerm and status', async () => {
    const fetch = mockFetchSuccess({ blogs: [] });
    await getTool('ghl_get_blog_posts').handler(
      { blogId: 'blog1', limit: 10, offset: 0, searchTerm: 'foo', status: 'PUBLISHED' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.searchTerm).toBe('foo');
    expect(call.params.status).toBe('PUBLISHED');
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_blog_posts').handler(
      { blogId: 'blog1', limit: 10, offset: 0 },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_check_blog_url_slug ──────────────────────────────────────────────────

describe('ghl_check_blog_url_slug', () => {
  it('calls GET /blogs/posts/url-slug-exists with locationId, urlSlug', async () => {
    const fetch = mockFetchSuccess({ exists: false });
    const result = await getTool('ghl_check_blog_url_slug').handler(
      { urlSlug: 'my-post' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/blogs/posts/url-slug-exists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.urlSlug).toBe('my-post');
    expectSuccess(result, { exists: false });
  });

  it('passes optional postId', async () => {
    const fetch = mockFetchSuccess({ exists: true });
    await getTool('ghl_check_blog_url_slug').handler(
      { urlSlug: 'my-post', postId: 'post1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.postId).toBe('post1');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_check_blog_url_slug').handler({ urlSlug: 'my-post' }, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_create_blog_post ─────────────────────────────────────────────────────

const CREATE_POST_ARGS = {
  title: 'My Post',
  blogId: 'blog1',
  imageUrl: 'https://example.com/img.png',
  description: 'A short description',
  rawHTML: '<h1>Hello</h1>',
  status: 'DRAFT',
  imageAltText: 'Alt text',
  categories: ['cat1', 'cat2'],
  author: 'author1',
  urlSlug: 'my-post',
  publishedAt: '2025-02-05T18:30:47.000Z',
};

describe('ghl_create_blog_post', () => {
  it('calls POST /blogs/posts with body including all required fields plus locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_blog_post').handler(CREATE_POST_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/blogs/posts');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.title).toBe('My Post');
    expect(call.body.blogId).toBe('blog1');
    expect(call.body.imageUrl).toBe(CREATE_POST_ARGS.imageUrl);
    expect(call.body.description).toBe(CREATE_POST_ARGS.description);
    expect(call.body.rawHTML).toBe(CREATE_POST_ARGS.rawHTML);
    expect(call.body.status).toBe('DRAFT');
    expect(call.body.imageAltText).toBe('Alt text');
    expect(call.body.categories).toEqual(['cat1', 'cat2']);
    expect(call.body.author).toBe('author1');
    expect(call.body.urlSlug).toBe('my-post');
    expect(call.body.publishedAt).toBe(CREATE_POST_ARGS.publishedAt);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional tags and canonicalLink', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_blog_post').handler(
      { ...CREATE_POST_ARGS, tags: ['blog', 'seo'], canonicalLink: 'https://example.com/post' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.tags).toEqual(['blog', 'seo']);
    expect(call.body.canonicalLink).toBe('https://example.com/post');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_blog_post').handler(CREATE_POST_ARGS, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_update_blog_post ─────────────────────────────────────────────────────

const UPDATE_POST_ARGS = {
  postId: 'post1',
  ...CREATE_POST_ARGS,
  wordCount: 100,
};

describe('ghl_update_blog_post', () => {
  it('calls PUT /blogs/posts/:postId with body including all required fields plus locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_blog_post').handler(UPDATE_POST_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/blogs/posts/post1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.title).toBe('My Post');
    expect(call.body.blogId).toBe('blog1');
    expect(call.body.imageUrl).toBe(CREATE_POST_ARGS.imageUrl);
    expect(call.body.description).toBe(CREATE_POST_ARGS.description);
    expect(call.body.rawHTML).toBe(CREATE_POST_ARGS.rawHTML);
    expect(call.body.status).toBe('DRAFT');
    expect(call.body.imageAltText).toBe('Alt text');
    expect(call.body.categories).toEqual(['cat1', 'cat2']);
    expect(call.body.author).toBe('author1');
    expect(call.body.urlSlug).toBe('my-post');
    expect(call.body.wordCount).toBe(100);
    expect(call.body.publishedAt).toBe(CREATE_POST_ARGS.publishedAt);
    expect(call.body.postId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional tags and canonicalLink', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_blog_post').handler(
      { ...UPDATE_POST_ARGS, tags: ['blog', 'seo'], canonicalLink: 'https://example.com/post' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.tags).toEqual(['blog', 'seo']);
    expect(call.body.canonicalLink).toBe('https://example.com/post');
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_update_blog_post').handler(UPDATE_POST_ARGS, TEST_CONFIG);
    expectError(result, 404);
  });
});
