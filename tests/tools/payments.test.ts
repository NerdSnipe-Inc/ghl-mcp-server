import { describe, it, expect } from 'vitest';
import { paymentTools, invoiceTools } from '../../src/tools/payments.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const allPaymentTools = [...paymentTools, ...invoiceTools];

const getTool = (name: string) => {
  const tool = allPaymentTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_orders ────────────────────────────────────────────────────────────

describe('ghl_get_orders', () => {
  it('calls GET /payments/orders with altId and altType', async () => {
    const fetch = mockFetchSuccess({ orders: [] });
    await getTool('ghl_get_orders').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/payments/orders');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('passes contactId and status filters', async () => {
    const fetch = mockFetchSuccess({ orders: [] });
    await getTool('ghl_get_orders').handler(
      { contactId: 'contact-abc', status: 'confirmed' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.contactId).toBe('contact-abc');
    expect(call.params.status).toBe('confirmed');
  });

  it('handles errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_orders').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_order ─────────────────────────────────────────────────────────────

describe('ghl_get_order', () => {
  it('calls GET /payments/orders/:id with altId', async () => {
    const fetch = mockFetchSuccess({ order: { id: 'ord-1' } });
    await getTool('ghl_get_order').handler({ orderId: 'ord-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/payments/orders/ord-1');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });
});

// ── ghl_get_transactions ──────────────────────────────────────────────────────

describe('ghl_get_transactions', () => {
  it('calls GET /payments/transactions with altId', async () => {
    const fetch = mockFetchSuccess({ transactions: [] });
    await getTool('ghl_get_transactions').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/payments/transactions');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });
});

// ── ghl_get_subscriptions ─────────────────────────────────────────────────────

describe('ghl_get_subscriptions', () => {
  it('calls GET /payments/subscriptions with altId', async () => {
    const fetch = mockFetchSuccess({ subscriptions: [] });
    await getTool('ghl_get_subscriptions').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/payments/subscriptions');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });
});

// ── ghl_get_coupons ───────────────────────────────────────────────────────────

describe('ghl_get_coupons', () => {
  it('calls GET /payments/coupon/list with altId', async () => {
    const fetch = mockFetchSuccess({ coupons: [] });
    await getTool('ghl_get_coupons').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/payments/coupon/list');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });
});

// ── ghl_create_coupon ─────────────────────────────────────────────────────────

describe('ghl_create_coupon', () => {
  it('calls POST /payments/coupon with coupon data and altId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_coupon').handler(
      {
        name: '20% Off',
        code: 'SAVE20',
        discountType: 'percentage',
        discount: 20,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/payments/coupon');
    expect(call.body?.code).toBe('SAVE20');
    expect(call.body?.discountType).toBe('percentage');
    expect(call.body?.discount).toBe(20);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
  });
});

// ── ghl_get_invoices ──────────────────────────────────────────────────────────

describe('ghl_get_invoices', () => {
  it('calls GET /invoices/ with altId', async () => {
    const fetch = mockFetchSuccess({ invoices: [] });
    await getTool('ghl_get_invoices').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/invoices/');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('passes status and contactId filters', async () => {
    const fetch = mockFetchSuccess({ invoices: [] });
    await getTool('ghl_get_invoices').handler(
      { status: 'paid', contactId: 'contact-abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('paid');
    expect(call.params.contactId).toBe('contact-abc');
  });

  it('handles errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_invoices').handler({}, TEST_CONFIG), 500);
  });
});

// ── ghl_get_invoice ───────────────────────────────────────────────────────────

describe('ghl_get_invoice', () => {
  it('calls GET /invoices/:id', async () => {
    const fetch = mockFetchSuccess({ invoice: { id: 'inv-1' } });
    await getTool('ghl_get_invoice').handler({ invoiceId: 'inv-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/invoices/inv-1');
  });
});

// ── ghl_create_invoice ────────────────────────────────────────────────────────

describe('ghl_create_invoice', () => {
  it('calls POST /invoices/ with contact, items, and altId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_invoice').handler(
      {
        contactId: 'contact-abc',
        name: 'Invoice #001',
        items: [{ name: 'Consulting', quantity: 1, unitAmount: 100000 }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.name).toBe('Invoice #001');
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(Array.isArray(call.body?.items)).toBe(true);
  });
});

// ── ghl_send_invoice ──────────────────────────────────────────────────────────

describe('ghl_send_invoice', () => {
  it('calls POST /invoices/:id/send', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_invoice').handler({ invoiceId: 'inv-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/inv-1/send');
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
  });
});

// ── ghl_void_invoice ──────────────────────────────────────────────────────────

describe('ghl_void_invoice', () => {
  it('calls POST /invoices/:id/void', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_void_invoice').handler({ invoiceId: 'inv-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/inv-1/void');
  });
});

// ── ghl_record_invoice_payment ────────────────────────────────────────────────

describe('ghl_record_invoice_payment', () => {
  it('calls POST /invoices/:id/record-payment with amount', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_record_invoice_payment').handler(
      { invoiceId: 'inv-1', amount: 50000 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/inv-1/record-payment');
    expect(call.body?.amount).toBe(50000);
    expect(call.body?.invoiceId).toBeUndefined();
  });

  it('includes paymentMethod when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_record_invoice_payment').handler(
      { invoiceId: 'inv-1', amount: 10000, paymentMethod: 'check' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.paymentMethod).toBe('check');
  });
});
