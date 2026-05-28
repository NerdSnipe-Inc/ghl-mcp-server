import { describe, it, expect } from 'vitest';
import { contactTools } from '../src/tools/contacts.js';
import { conversationTools } from '../src/tools/conversations.js';
import { calendarTools } from '../src/tools/calendars.js';
import { opportunityTools } from '../src/tools/opportunities.js';
import { workflowTools } from '../src/tools/workflows.js';
import { locationTools } from '../src/tools/location.js';
import { tagTools } from '../src/tools/tags.js';
import { customFieldTools } from '../src/tools/custom_fields.js';
import { customValueTools } from '../src/tools/custom_values.js';
import { userTools } from '../src/tools/users.js';
import { templateTools } from '../src/tools/templates.js';
import { formTools } from '../src/tools/forms.js';
import { surveyTools } from '../src/tools/surveys.js';
import { emailBuilderTools, emailCampaignTools } from '../src/tools/emails.js';
import { funnelTools } from '../src/tools/funnels.js';
import { phoneNumberTools } from '../src/tools/phone_numbers.js';
import { paymentTools, invoiceTools } from '../src/tools/payments.js';
import { socialTools, mediaTools, triggerLinkTools } from '../src/tools/social.js';
import { knowledgeBaseTools, faqTools, crawlerTools } from '../src/tools/knowledge_base.js';

const ALL_TOOLS = [
  // CRM core
  ...contactTools,
  ...conversationTools,
  ...calendarTools,
  ...opportunityTools,
  ...workflowTools,

  // Location configuration
  ...locationTools,
  ...tagTools,
  ...customFieldTools,
  ...customValueTools,
  ...userTools,
  ...templateTools,
  ...formTools,
  ...surveyTools,

  // Marketing & content
  ...emailBuilderTools,
  ...emailCampaignTools,
  ...funnelTools,

  // Communications
  ...phoneNumberTools,

  // Commerce
  ...paymentTools,
  ...invoiceTools,

  // Social & media
  ...socialTools,
  ...mediaTools,
  ...triggerLinkTools,

  // Knowledge base, FAQ, crawler
  ...knowledgeBaseTools,
  ...faqTools,
  ...crawlerTools,
];

describe('Tool registry', () => {
  it('registers exactly 127 tools', () => {
    expect(ALL_TOOLS).toHaveLength(127);
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
  it('location has 1 tool', () => expect(locationTools).toHaveLength(1));
  it('tags has 3 tools', () => expect(tagTools).toHaveLength(3));
  it('customFields has 4 tools', () => expect(customFieldTools).toHaveLength(4));
  it('customValues has 4 tools', () => expect(customValueTools).toHaveLength(4));
  it('users has 6 tools', () => expect(userTools).toHaveLength(6));
  it('templates has 4 tools', () => expect(templateTools).toHaveLength(4));
  it('forms has 2 tools', () => expect(formTools).toHaveLength(2));
  it('surveys has 2 tools', () => expect(surveyTools).toHaveLength(2));
  it('emailBuilder has 5 tools', () => expect(emailBuilderTools).toHaveLength(5));
  it('emailCampaign has 4 tools', () => expect(emailCampaignTools).toHaveLength(4));
  it('funnels has 3 tools', () => expect(funnelTools).toHaveLength(3));
  it('phoneNumbers has 5 tools', () => expect(phoneNumberTools).toHaveLength(5));
  it('payments has 6 tools', () => expect(paymentTools).toHaveLength(6));
  it('invoices has 6 tools', () => expect(invoiceTools).toHaveLength(6));
  it('social has 4 tools', () => expect(socialTools).toHaveLength(4));
  it('media has 2 tools', () => expect(mediaTools).toHaveLength(2));
  it('triggerLinks has 3 tools', () => expect(triggerLinkTools).toHaveLength(3));
  it('knowledgeBase has 5 tools', () => expect(knowledgeBaseTools).toHaveLength(5));
  it('faq has 4 tools', () => expect(faqTools).toHaveLength(4));
  it('crawler has 5 tools', () => expect(crawlerTools).toHaveLength(5));
});

describe('Specific tool existence', () => {
  const toolNames = new Set(ALL_TOOLS.map((t) => t.name));

  const expectedTools = [
    // Contacts (20)
    'ghl_get_contacts', 'ghl_get_contact', 'ghl_create_contact',
    'ghl_update_contact', 'ghl_upsert_contact', 'ghl_delete_contact',
    'ghl_search_contacts', 'ghl_add_contact_tags', 'ghl_remove_contact_tags',
    'ghl_get_contact_notes', 'ghl_create_contact_note', 'ghl_update_contact_note',
    'ghl_delete_contact_note', 'ghl_get_contact_tasks', 'ghl_create_contact_task',
    'ghl_update_contact_task', 'ghl_delete_contact_task',
    'ghl_add_contact_to_workflow', 'ghl_remove_contact_from_workflow',
    'ghl_get_contact_appointments',
    // Conversations (9)
    'ghl_search_conversations', 'ghl_get_conversation', 'ghl_create_conversation',
    'ghl_get_messages', 'ghl_send_message', 'ghl_send_email',
    'ghl_update_message_status', 'ghl_cancel_scheduled_message', 'ghl_add_inbound_message',
    // Calendars (10)
    'ghl_get_calendars', 'ghl_get_calendar', 'ghl_get_free_slots',
    'ghl_get_calendar_events', 'ghl_create_appointment', 'ghl_get_appointment',
    'ghl_update_appointment', 'ghl_delete_calendar_event', 'ghl_create_block_slot',
    'ghl_get_calendar_groups',
    // Opportunities (8)
    'ghl_get_pipelines', 'ghl_search_opportunities', 'ghl_get_opportunity',
    'ghl_create_opportunity', 'ghl_update_opportunity', 'ghl_update_opportunity_status',
    'ghl_upsert_opportunity', 'ghl_delete_opportunity',
    // Workflows (2)
    'ghl_get_workflows', 'ghl_get_campaigns',
    // Location (1)
    'ghl_get_location',
    // Tags (3)
    'ghl_get_location_tags', 'ghl_create_location_tag', 'ghl_delete_location_tag',
    // Custom fields (4)
    'ghl_get_custom_fields', 'ghl_create_custom_field',
    'ghl_update_custom_field', 'ghl_delete_custom_field',
    // Custom values (4)
    'ghl_get_custom_values', 'ghl_create_custom_value', 'ghl_update_custom_value', 'ghl_delete_custom_value',
    // Users (6)
    'ghl_get_users', 'ghl_search_users', 'ghl_get_user',
    'ghl_create_user', 'ghl_update_user', 'ghl_delete_user',
    // Templates (4)
    'ghl_get_templates', 'ghl_create_template', 'ghl_update_template', 'ghl_delete_template',
    // Forms (2)
    'ghl_get_forms', 'ghl_get_form_submissions',
    // Surveys (2)
    'ghl_get_surveys', 'ghl_get_survey_submissions',
    // Email builder (5)
    'ghl_get_email_builder_templates', 'ghl_get_email_builder_template',
    'ghl_create_email_builder_template', 'ghl_update_email_builder_template',
    'ghl_delete_email_builder_template',
    // Email campaigns (4)
    'ghl_get_email_campaigns', 'ghl_get_email_campaign',
    'ghl_create_email_campaign', 'ghl_delete_email_campaign',
    // Funnels (3)
    'ghl_get_funnels', 'ghl_get_funnel_pages', 'ghl_get_funnel_page_count',
    // Phone numbers (5)
    'ghl_get_phone_numbers', 'ghl_search_available_phone_numbers',
    'ghl_purchase_phone_number', 'ghl_release_phone_number', 'ghl_update_phone_number',
    // Payments (6)
    'ghl_get_orders', 'ghl_get_order', 'ghl_get_transactions',
    'ghl_get_subscriptions', 'ghl_get_coupons', 'ghl_create_coupon',
    // Invoices (6)
    'ghl_get_invoices', 'ghl_get_invoice', 'ghl_create_invoice',
    'ghl_send_invoice', 'ghl_void_invoice', 'ghl_record_invoice_payment',
    // Social (4)
    'ghl_get_social_accounts', 'ghl_get_social_posts', 'ghl_create_social_post',
    'ghl_delete_social_post',
    // Media (2)
    'ghl_get_media_files', 'ghl_delete_media_file',
    // Trigger links (3)
    'ghl_get_trigger_links', 'ghl_create_trigger_link', 'ghl_delete_trigger_link',
    // Knowledge base (5)
    'ghl_list_knowledge_bases', 'ghl_get_knowledge_base', 'ghl_create_knowledge_base',
    'ghl_update_knowledge_base', 'ghl_delete_knowledge_base',
    // FAQ (4)
    'ghl_list_faqs', 'ghl_create_faq', 'ghl_update_faq', 'ghl_delete_faq',
    // Crawler (5)
    'ghl_list_crawler_urls', 'ghl_discover_website', 'ghl_get_crawler_status',
    'ghl_train_crawler_urls', 'ghl_delete_crawler_urls',
  ];

  it('all 127 expected tools are present', () => {
    expectedTools.forEach((name) => {
      expect(toolNames.has(name), `Missing tool: ${name}`).toBe(true);
    });
    expect(expectedTools).toHaveLength(127);
  });
});
