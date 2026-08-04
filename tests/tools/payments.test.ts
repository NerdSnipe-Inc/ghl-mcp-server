import { describe, it, expect } from 'vitest';
import { paymentTools, invoiceTools } from '../../src/tools/payments.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('passes contactId and paymentStatus filters', async () => {
    const fetch = mockFetchSuccess({ orders: [] });
    await getTool('ghl_get_orders').handler(
      { contactId: 'contact-abc', paymentStatus: 'paid' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.contactId).toBe('contact-abc');
    expect(call.params.paymentStatus).toBe('paid');
  });

  it('uses limit/offset for pagination, not page', async () => {
    const fetch = mockFetchSuccess({ orders: [] });
    await getTool('ghl_get_orders').handler({ limit: 5, offset: 10 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('5');
    expect(call.params.offset).toBe('10');
    expect(call.params.page).toBeUndefined();
  });

  it('rejects an invalid paymentStatus value', () => {
    const schema = getTool('ghl_get_orders').inputSchema;
    const result = schema.safeParse({ paymentStatus: 'confirmed' });
    expect(result.success).toBe(false);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('uses limit/offset for pagination, not page', async () => {
    const fetch = mockFetchSuccess({ transactions: [] });
    await getTool('ghl_get_transactions').handler({ limit: 5, offset: 10 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('5');
    expect(call.params.offset).toBe('10');
    expect(call.params.page).toBeUndefined();
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('uses limit/offset for pagination, not page', async () => {
    const fetch = mockFetchSuccess({ subscriptions: [] });
    await getTool('ghl_get_subscriptions').handler({ limit: 5, offset: 10 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('5');
    expect(call.params.offset).toBe('10');
    expect(call.params.page).toBeUndefined();
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });
});

// ── ghl_create_coupon ─────────────────────────────────────────────────────────

describe('ghl_create_coupon', () => {
  it('calls POST /payments/coupon with discountValue, discountType, startDate, and altId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_coupon').handler(
      {
        name: '20% Off',
        code: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
        startDate: '2024-01-01T00:00:00.000Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/payments/coupon');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.code).toBe('SAVE20');
    expect(call.body?.discountType).toBe('percentage');
    expect(call.body?.discountValue).toBe(20);
    expect(call.body?.startDate).toBe('2024-01-01T00:00:00.000Z');
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
  });

  it('rejects missing startDate (required by spec)', () => {
    const schema = getTool('ghl_create_coupon').inputSchema;
    const result = schema.safeParse({
      name: '20% Off',
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid discountType "fixed" (spec enum is percentage/amount)', () => {
    const schema = getTool('ghl_create_coupon').inputSchema;
    const result = schema.safeParse({
      name: '20% Off',
      code: 'SAVE20',
      discountType: 'fixed',
      discountValue: 20,
      startDate: '2024-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts discountType "amount"', () => {
    const schema = getTool('ghl_create_coupon').inputSchema;
    const result = schema.safeParse({
      name: '20% Off',
      code: 'SAVE20',
      discountType: 'amount',
      discountValue: 20,
      startDate: '2024-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_invoice ────────────────────────────────────────────────────────

const VALID_INVOICE_ARGS = {
  name: 'Invoice #001',
  currency: 'USD',
  businessDetails: { name: 'ABC Corp.' },
  contactDetails: { id: 'contact-abc', name: 'Alex', phoneNo: '+1234567890', email: 'alex@example.com' },
  items: [{ name: 'Consulting', qty: 1, amount: 100000, currency: 'USD' }],
  discount: { type: 'percentage' as const, value: 0 },
  issueDate: '2024-01-01',
  sentTo: { email: ['alex@example.com'] },
  liveMode: true,
};

describe('ghl_create_invoice', () => {
  it('calls POST /invoices/ with businessDetails, contactDetails, items, discount, issueDate, sentTo, liveMode, and altId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_invoice').handler(VALID_INVOICE_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.contactDetails).toEqual(VALID_INVOICE_ARGS.contactDetails);
    expect(call.body?.contactId).toBeUndefined();
    expect(call.body?.businessDetails).toEqual(VALID_INVOICE_ARGS.businessDetails);
    expect(call.body?.name).toBe('Invoice #001');
    expect(call.body?.issueDate).toBe('2024-01-01');
    expect(call.body?.sentTo).toEqual(VALID_INVOICE_ARGS.sentTo);
    expect(call.body?.liveMode).toBe(true);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(Array.isArray(call.body?.items)).toBe(true);
    expect((call.body?.items as Array<Record<string, unknown>>)[0].amount).toBe(100000);
    expect((call.body?.items as Array<Record<string, unknown>>)[0].qty).toBe(1);
  });

  it.each(['businessDetails', 'contactDetails', 'issueDate', 'sentTo', 'liveMode', 'discount'])(
    'rejects missing required field %s',
    (field) => {
      const schema = getTool('ghl_create_invoice').inputSchema;
      const args = { ...VALID_INVOICE_ARGS } as Record<string, unknown>;
      delete args[field];
      const result = schema.safeParse(args);
      expect(result.success).toBe(false);
    }
  );
});

// ── ghl_send_invoice ──────────────────────────────────────────────────────────

describe('ghl_send_invoice', () => {
  it('calls POST /invoices/:id/send with a valid action', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_invoice').handler(
      { invoiceId: 'inv-1', userId: 'user-1', action: 'email' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/inv-1/send');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.action).toBe('email');
  });

  it.each(['sms_and_email', 'send_manually', 'email', 'sms'])('accepts action %s', async (action) => {
    mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_send_invoice').handler(
      { invoiceId: 'inv-1', userId: 'user-1', action },
      TEST_CONFIG
    );
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('rejects invalid action values ("send"/"resend" are not real enum values)', () => {
    const schema = getTool('ghl_send_invoice').inputSchema;
    expect(schema.safeParse({ invoiceId: 'inv-1', userId: 'user-1', action: 'send' }).success).toBe(false);
    expect(schema.safeParse({ invoiceId: 'inv-1', userId: 'user-1', action: 'resend' }).success).toBe(false);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_record_invoice_payment ────────────────────────────────────────────────

describe('ghl_record_invoice_payment', () => {
  it('calls POST /invoices/:id/record-payment with altId, altType, mode, notes, and amount', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_record_invoice_payment').handler(
      { invoiceId: 'inv-1', amount: 50000, mode: 'cash', notes: 'Paid in cash' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/invoices/inv-1/record-payment');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.amount).toBe(50000);
    expect(call.body?.invoiceId).toBeUndefined();
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.mode).toBe('cash');
    expect(call.body?.notes).toBe('Paid in cash');
  });

  it('includes structured card details when mode is card', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_record_invoice_payment').handler(
      {
        invoiceId: 'inv-1',
        amount: 10000,
        mode: 'card',
        notes: 'Paid by card',
        card: { brand: 'visa', last4: '4242' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.mode).toBe('card');
    expect(call.body?.card).toEqual({ brand: 'visa', last4: '4242' });
  });

  it('includes structured cheque details when mode is cheque', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_record_invoice_payment').handler(
      {
        invoiceId: 'inv-1',
        amount: 10000,
        mode: 'cheque',
        notes: 'Paid by cheque',
        cheque: { number: '129-129-129-912' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.mode).toBe('cheque');
    expect(call.body?.cheque).toEqual({ number: '129-129-129-912' });
  });

  it('rejects invalid mode values ("check"/"credit_card" are not real enum values)', () => {
    const schema = getTool('ghl_record_invoice_payment').inputSchema;
    expect(
      schema.safeParse({ invoiceId: 'inv-1', amount: 10000, mode: 'check', notes: 'x' }).success
    ).toBe(false);
    expect(
      schema.safeParse({ invoiceId: 'inv-1', amount: 10000, mode: 'credit_card', notes: 'x' }).success
    ).toBe(false);
  });

  it('rejects missing required notes', () => {
    const schema = getTool('ghl_record_invoice_payment').inputSchema;
    const result = schema.safeParse({ invoiceId: 'inv-1', amount: 10000, mode: 'cash' });
    expect(result.success).toBe(false);
  });
});
