import { describe, it, expect } from 'vitest';
import { contactTools } from '../src/tools/contacts.js';
import { conversationTools } from '../src/tools/conversations.js';
import { calendarTools } from '../src/tools/calendars.js';
import { opportunityTools } from '../src/tools/opportunities.js';
import { workflowTools } from '../src/tools/workflows.js';
import { locationTools } from '../src/tools/locations.js';
import { paymentTools, invoiceTools } from '../src/tools/payments.js';
import { socialTools, mediaTools, triggerLinkTools } from '../src/tools/social.js';

const ALL_TOOLS = [
  ...contactTools,
  ...conversationTools,
  ...calendarTools,
  ...opportunityTools,
  ...workflowTools,
  ...locationTools,
  ...paymentTools,
  ...invoiceTools,
  ...socialTools,
  ...mediaTools,
  ...triggerLinkTools,
];

describe('Tool registry', () => {
  it('registers exactly 86 tools', () => {
    expect(ALL_TOOLS).toHaveLength(86);
  });

  it('every tool name starts with ghl_', () => {
    const nonPrefixed = ALL_TOOLS.filter((t) => !t.name.startsWith('ghl_'));
    expect(nonPrefixed).toHaveLength(0);
  });

  it('every tool has a non-empty name', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.name.length).toBeGreaterThan(0);
    });
  });

  it('every tool has a non-empty description', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.description.length).toBeGreaterThan(10);
    });
  });

  it('every tool has an inputSchema', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.inputSchema).toBeDefined();
    });
  });

  it('every tool has a handler function', () => {
    ALL_TOOLS.forEach((t) => {
      expect(typeof t.handler).toBe('function');
    });
  });

  it('has no duplicate tool names', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('Tool counts per module', () => {
  it('contacts has 20 tools', () => expect(contactTools).toHaveLength(20));
  it('conversations has 9 tools', () => expect(conversationTools).toHaveLength(9));
  it('calendars has 10 tools', () => expect(calendarTools).toHaveLength(10));
  it('opportunities has 8 tools', () => expect(opportunityTools).toHaveLength(8));
  it('workflows has 2 tools', () => expect(workflowTools).toHaveLength(2));
  it('locations has 16 tools', () => expect(locationTools).toHaveLength(16));
  it('payments has 6 tools', () => expect(paymentTools).toHaveLength(6));
  it('invoices has 6 tools', () => expect(invoiceTools).toHaveLength(6));
  it('social has 4 tools', () => expect(socialTools).toHaveLength(4));
  it('media has 2 tools', () => expect(mediaTools).toHaveLength(2));
  it('triggerLinks has 3 tools', () => expect(triggerLinkTools).toHaveLength(3));
});

describe('Specific tool existence', () => {
  const toolNames = new Set(ALL_TOOLS.map((t) => t.name));

  const expectedTools = [
    // Contacts
    'ghl_get_contacts', 'ghl_get_contact', 'ghl_create_contact',
    'ghl_update_contact', 'ghl_upsert_contact', 'ghl_delete_contact',
    'ghl_search_contacts', 'ghl_add_contact_tags', 'ghl_remove_contact_tags',
    'ghl_get_contact_notes', 'ghl_create_contact_note', 'ghl_update_contact_note',
    'ghl_delete_contact_note', 'ghl_get_contact_tasks', 'ghl_create_contact_task',
    'ghl_update_contact_task', 'ghl_delete_contact_task',
    'ghl_add_contact_to_workflow', 'ghl_remove_contact_from_workflow',
    'ghl_get_contact_appointments',
    // Conversations
    'ghl_search_conversations', 'ghl_get_conversation', 'ghl_create_conversation',
    'ghl_get_messages', 'ghl_send_message', 'ghl_send_email',
    'ghl_update_message_status', 'ghl_cancel_scheduled_message', 'ghl_add_inbound_message',
    // Calendars
    'ghl_get_calendars', 'ghl_get_calendar', 'ghl_get_free_slots',
    'ghl_get_calendar_events', 'ghl_create_appointment', 'ghl_get_appointment',
    'ghl_update_appointment', 'ghl_delete_calendar_event', 'ghl_create_block_slot',
    'ghl_get_calendar_groups',
    // Opportunities
    'ghl_get_pipelines', 'ghl_search_opportunities', 'ghl_get_opportunity',
    'ghl_create_opportunity', 'ghl_update_opportunity', 'ghl_update_opportunity_status',
    'ghl_upsert_opportunity', 'ghl_delete_opportunity',
    // Workflows
    'ghl_get_workflows', 'ghl_get_campaigns',
    // Locations
    'ghl_get_location', 'ghl_get_location_tags', 'ghl_create_location_tag',
    'ghl_delete_location_tag', 'ghl_get_custom_fields', 'ghl_create_custom_field',
    'ghl_update_custom_field', 'ghl_delete_custom_field', 'ghl_get_custom_values',
    'ghl_create_custom_value', 'ghl_update_custom_value', 'ghl_get_users',
    'ghl_search_users', 'ghl_get_templates', 'ghl_get_forms', 'ghl_get_form_submissions',
    // Payments
    'ghl_get_orders', 'ghl_get_order', 'ghl_get_transactions',
    'ghl_get_subscriptions', 'ghl_get_coupons', 'ghl_create_coupon',
    // Invoices
    'ghl_get_invoices', 'ghl_get_invoice', 'ghl_create_invoice',
    'ghl_send_invoice', 'ghl_void_invoice', 'ghl_record_invoice_payment',
    // Social
    'ghl_get_social_accounts', 'ghl_get_social_posts', 'ghl_create_social_post',
    'ghl_delete_social_post',
    // Media
    'ghl_get_media_files', 'ghl_delete_media_file',
    // Trigger links
    'ghl_get_trigger_links', 'ghl_create_trigger_link', 'ghl_delete_trigger_link',
  ];

  it('all 86 expected tools are present', () => {
    expectedTools.forEach((name) => {
      expect(toolNames.has(name), `Missing tool: ${name}`).toBe(true);
    });
    expect(expectedTools).toHaveLength(86); // 20 contacts + 66 across other modules
  });
});
