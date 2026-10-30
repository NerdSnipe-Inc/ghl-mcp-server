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
import { productTools } from '../src/tools/products.js';
import { productCollectionTools } from '../src/tools/product_collections.js';
import { productReviewTools } from '../src/tools/product_reviews.js';
import { productStoreTools } from '../src/tools/product_store.js';
import { storeTools } from '../src/tools/store.js';
import { affiliateManagerTools } from '../src/tools/affiliate_manager.js';
import { emailIsvTools } from '../src/tools/email_isv.js';
import { socialTools, mediaTools, triggerLinkTools } from '../src/tools/social.js';
import { knowledgeBaseTools, faqTools, crawlerTools } from '../src/tools/knowledge_base.js';
import { blogTools } from '../src/tools/blogs.js';
import { businessesTools } from '../src/tools/businesses.js';
import { associationsTools } from '../src/tools/associations.js';
import { objectsTools } from '../src/tools/objects.js';
import { courseTools } from '../src/tools/courses.js';
import { proposalTools } from '../src/tools/proposals.js';
import { brandBoardTools } from '../src/tools/brand_boards.js';
import { customMenuTools } from '../src/tools/custom_menus.js';
import { conversationAiTools } from '../src/tools/conversation_ai.js';
import { voiceAiTools } from '../src/tools/voice_ai.js';
import { chatWidgetTools } from '../src/tools/chat_widget.js';
import { agentStudioTools } from '../src/tools/agent_studio.js';
import { socialPlannerQueuesTools } from '../src/tools/social_planner_queues.js';
import { socialPlannerCommentsTools } from '../src/tools/social_planner_comments.js';
import { socialPlannerAccountsTools } from '../src/tools/social_planner_accounts.js';
import { socialPlannerPostsTools } from '../src/tools/social_planner_posts.js';
import { facebookAccountsTools } from '../src/tools/facebook_accounts.js';
import { facebookCampaignsTools } from '../src/tools/facebook_campaigns.js';
import { facebookAudiencesTools } from '../src/tools/facebook_audiences.js';
import { facebookReportingTools } from '../src/tools/facebook_reporting.js';
import { googleAccountsTools } from '../src/tools/google_accounts.js';
import { googleCampaignsTools } from '../src/tools/google_campaigns.js';
import { googleAudiencesTools } from '../src/tools/google_audiences.js';
import { googleReportingTools } from '../src/tools/google_reporting.js';
import { linkedinTools } from '../src/tools/linkedin.js';

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
  ...blogTools,
  ...courseTools,
  ...proposalTools,
  ...brandBoardTools,
  ...customMenuTools,

  // Communications
  ...phoneNumberTools,

  // Commerce
  ...paymentTools,
  ...invoiceTools,
  ...productTools,
  ...productCollectionTools,
  ...productReviewTools,
  ...productStoreTools,
  ...storeTools,
  ...affiliateManagerTools,
  ...emailIsvTools,

  // Social & media
  ...socialTools,
  ...mediaTools,
  ...triggerLinkTools,

  // Marketing & content (continued)
  ...businessesTools,
  ...associationsTools,
  ...objectsTools,

  // Knowledge base, FAQ, crawler
  ...knowledgeBaseTools,
  ...faqTools,
  ...crawlerTools,

  // AI / Communication
  ...conversationAiTools,
  ...voiceAiTools,
  ...chatWidgetTools,
  ...agentStudioTools,

  // Social planner — content queues
  ...socialPlannerQueuesTools,

  // Social planner — comments
  ...socialPlannerCommentsTools,
  ...socialPlannerAccountsTools,
  ...socialPlannerPostsTools,
  ...facebookAccountsTools,
  ...facebookCampaignsTools,
  ...facebookAudiencesTools,
  ...facebookReportingTools,
  ...googleAccountsTools,
  ...googleCampaignsTools,
  ...googleAudiencesTools,
  ...googleReportingTools,
  ...linkedinTools,
];

describe('Tool registry', () => {
  it('registers exactly 411 tools', () => {
    expect(ALL_TOOLS).toHaveLength(411);
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
  it('contacts has 19 tools', () => expect(contactTools).toHaveLength(19));
  it('conversations has 9 tools', () => expect(conversationTools).toHaveLength(9));
  it('calendars has 10 tools', () => expect(calendarTools).toHaveLength(10));
  it('opportunities has 8 tools', () => expect(opportunityTools).toHaveLength(8));
  it('workflows has 12 tools', () => expect(workflowTools).toHaveLength(12));
  it('location has 1 tool', () => expect(locationTools).toHaveLength(1));
  it('tags has 3 tools', () => expect(tagTools).toHaveLength(3));
  it('customFields has 4 tools', () => expect(customFieldTools).toHaveLength(4));
  it('customValues has 4 tools', () => expect(customValueTools).toHaveLength(4));
  it('users has 6 tools', () => expect(userTools).toHaveLength(6));
  it('templates has 2 tools', () => expect(templateTools).toHaveLength(2));
  it('forms has 2 tools', () => expect(formTools).toHaveLength(2));
  it('surveys has 2 tools', () => expect(surveyTools).toHaveLength(2));
  it('emailBuilder has 5 tools', () => expect(emailBuilderTools).toHaveLength(5));
  it('emailCampaign has 5 tools', () => expect(emailCampaignTools).toHaveLength(5));
  it('funnels has 3 tools', () => expect(funnelTools).toHaveLength(3));
  it('blogs has 7 tools', () => expect(blogTools).toHaveLength(7));
  it('businesses has 5 tools', () => expect(businessesTools).toHaveLength(5));
  it('associations has 10 tools', () => expect(associationsTools).toHaveLength(10));
  it('objects has 8 tools', () => expect(objectsTools).toHaveLength(8));
  it('courses has 1 tool', () => expect(courseTools).toHaveLength(1));
  it('proposals has 4 tools', () => expect(proposalTools).toHaveLength(4));
  it('brandBoards has 11 tools', () => expect(brandBoardTools).toHaveLength(11));
  it('customMenus has 5 tools', () => expect(customMenuTools).toHaveLength(5));
  it('phoneNumbers has 5 tools', () => expect(phoneNumberTools).toHaveLength(5));
  it('payments has 6 tools', () => expect(paymentTools).toHaveLength(6));
  it('invoices has 6 tools', () => expect(invoiceTools).toHaveLength(6));
  it('products has 14 tools', () => expect(productTools).toHaveLength(14));
  it('productCollections has 5 tools', () => expect(productCollectionTools).toHaveLength(5));
  it('productReviews has 5 tools', () => expect(productReviewTools).toHaveLength(5));
  it('productStore has 3 tools', () => expect(productStoreTools).toHaveLength(3));
  it('store has 18 tools', () => expect(storeTools).toHaveLength(18));
  it('social has 4 tools', () => expect(socialTools).toHaveLength(4));
  it('media has 2 tools', () => expect(mediaTools).toHaveLength(2));
  it('triggerLinks has 3 tools', () => expect(triggerLinkTools).toHaveLength(3));
  it('knowledgeBase has 5 tools', () => expect(knowledgeBaseTools).toHaveLength(5));
  it('faq has 4 tools', () => expect(faqTools).toHaveLength(4));
  it('crawler has 5 tools', () => expect(crawlerTools).toHaveLength(5));
  it('affiliateManager has 4 tools', () => expect(affiliateManagerTools).toHaveLength(4));
  it('emailIsv has 1 tool', () => expect(emailIsvTools).toHaveLength(1));
  it('conversationAi has 12 tools', () => expect(conversationAiTools).toHaveLength(12));
  it('voiceAi has 11 tools', () => expect(voiceAiTools).toHaveLength(11));
  it('chatWidget has 8 tools', () => expect(chatWidgetTools).toHaveLength(8));
  it('agentStudio has 8 tools', () => expect(agentStudioTools).toHaveLength(8));
  it('socialPlannerQueues has 18 tools', () => expect(socialPlannerQueuesTools).toHaveLength(18));
  it('socialPlannerComments has 4 tools', () => expect(socialPlannerCommentsTools).toHaveLength(4));
  it('socialPlannerAccounts has 9 tools', () => expect(socialPlannerAccountsTools).toHaveLength(9));
  it('socialPlannerPosts has 10 tools', () => expect(socialPlannerPostsTools).toHaveLength(10));
  it('facebookAccounts has 14 tools', () => expect(facebookAccountsTools).toHaveLength(14));
  it('facebookCampaigns has 18 tools', () => expect(facebookCampaignsTools).toHaveLength(18));
  it('facebookAudiences has 12 tools', () => expect(facebookAudiencesTools).toHaveLength(12));
  it('facebookReporting has 4 tools', () => expect(facebookReportingTools).toHaveLength(4));
  it('googleAccounts has 7 tools', () => expect(googleAccountsTools).toHaveLength(7));
  it('googleCampaigns has 6 tools', () => expect(googleCampaignsTools).toHaveLength(6));
  it('googleAudiences has 14 tools', () => expect(googleAudiencesTools).toHaveLength(14));
  it('googleReporting has 4 tools', () => expect(googleReportingTools).toHaveLength(4));
  it('linkedin has 16 tools', () => expect(linkedinTools).toHaveLength(16));
});

describe('Specific tool existence', () => {
  const toolNames = new Set(ALL_TOOLS.map((t) => t.name));

  const expectedTools = [
    // Contacts (19)
    'ghl_get_contact', 'ghl_create_contact',
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
    // Workflows (12)
    'ghl_get_workflows', 'ghl_get_campaigns',
    'ghl_create_workflow', 'ghl_get_workflow_definition', 'ghl_update_workflow_definition',
    'ghl_update_workflow_status', 'ghl_delete_workflow', 'ghl_search_workflows',
    'ghl_get_workflow_step_types', 'ghl_validate_workflow_definition', 'ghl_get_workflow_logs',
    'ghl_get_workflow_log_statistics',
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
    'ghl_get_templates', 'ghl_delete_template',
    // Forms (2)
    'ghl_get_forms', 'ghl_get_form_submissions',
    // Surveys (2)
    'ghl_get_surveys', 'ghl_get_survey_submissions',
    // Email builder (5)
    'ghl_get_email_builder_templates', 'ghl_get_email_builder_template',
    'ghl_create_email_builder_template', 'ghl_update_email_builder_template',
    'ghl_delete_email_builder_template',
    // Email campaigns (5)
    'ghl_get_email_campaigns', 'ghl_get_email_campaign',
    'ghl_create_email_campaign', 'ghl_schedule_email_campaign', 'ghl_delete_email_campaign',
    // Funnels (3)
    'ghl_get_funnels', 'ghl_get_funnel_pages', 'ghl_get_funnel_page_count',
    // Blogs (7)
    'ghl_get_blog_authors', 'ghl_get_blog_categories', 'ghl_get_blogs',
    'ghl_get_blog_posts', 'ghl_check_blog_url_slug', 'ghl_create_blog_post',
    'ghl_update_blog_post',
    // Businesses (5)
    'ghl_get_businesses', 'ghl_get_business', 'ghl_create_business',
    'ghl_update_business', 'ghl_delete_business',
    // Associations (10)
    'ghl_create_association_relation', 'ghl_get_association_relations',
    'ghl_delete_association_relation', 'ghl_get_association_by_key',
    'ghl_get_association_by_object_key', 'ghl_create_association',
    'ghl_get_association', 'ghl_update_association', 'ghl_delete_association',
    'ghl_list_associations',
    // Objects (8)
    'ghl_get_object_schema', 'ghl_update_object_schema', 'ghl_get_objects',
    'ghl_get_object_record', 'ghl_update_object_record', 'ghl_delete_object_record',
    'ghl_create_object_record', 'ghl_search_object_records',
    // Courses (1)
    'ghl_import_courses',
    // Proposals (4)
    'ghl_get_proposal_documents', 'ghl_send_proposal_document',
    'ghl_get_proposal_templates', 'ghl_send_proposal_template',
    // Brand boards (5)
    'ghl_create_brand_board', 'ghl_get_brand_boards', 'ghl_get_brand_board',
    'ghl_update_brand_board', 'ghl_delete_brand_board',
    // Brand voices (6)
    'ghl_get_brand_voices', 'ghl_create_brand_voice', 'ghl_get_brand_voice',
    'ghl_update_brand_voice', 'ghl_delete_brand_voice', 'ghl_set_default_brand_voice',
    // Custom menus (5)
    'ghl_get_custom_menus', 'ghl_get_custom_menu', 'ghl_create_custom_menu',
    'ghl_update_custom_menu', 'ghl_delete_custom_menu',
    // Phone numbers (5)
    'ghl_get_phone_numbers', 'ghl_search_available_phone_numbers',
    'ghl_purchase_phone_number', 'ghl_release_phone_number', 'ghl_update_phone_number',
    // Payments (6)
    'ghl_get_orders', 'ghl_get_order', 'ghl_get_transactions',
    'ghl_get_subscriptions', 'ghl_get_coupons', 'ghl_create_coupon',
    // Invoices (6)
    'ghl_get_invoices', 'ghl_get_invoice', 'ghl_create_invoice',
    'ghl_send_invoice', 'ghl_void_invoice', 'ghl_record_invoice_payment',
    // Products (14)
    'ghl_get_products', 'ghl_get_product', 'ghl_create_product',
    'ghl_update_product', 'ghl_delete_product', 'ghl_bulk_update_products',
    'ghl_bulk_edit_product_prices', 'ghl_get_product_prices', 'ghl_get_product_price',
    'ghl_create_product_price', 'ghl_update_product_price', 'ghl_delete_product_price',
    'ghl_get_product_inventory', 'ghl_update_product_inventory',
    // Product collections (5)
    'ghl_get_product_collections', 'ghl_get_product_collection', 'ghl_create_product_collection',
    'ghl_update_product_collection', 'ghl_delete_product_collection',
    // Product reviews (5)
    'ghl_get_product_reviews', 'ghl_get_product_review_count', 'ghl_bulk_update_product_reviews',
    'ghl_update_product_review', 'ghl_delete_product_review',
    // Product store (3)
    'ghl_set_product_store_visibility', 'ghl_update_product_store_priority',
    'ghl_get_product_store_stats',
    // Store — shipping carriers & zones (11)
    'ghl_get_shipping_carriers', 'ghl_create_shipping_carrier', 'ghl_get_shipping_carrier',
    'ghl_update_shipping_carrier', 'ghl_delete_shipping_carrier',
    'ghl_get_shipping_zones', 'ghl_create_shipping_zone', 'ghl_get_shipping_zone',
    'ghl_update_shipping_zone', 'ghl_delete_shipping_zone', 'ghl_get_available_shipping_rates',
    // Store — shipping rates & settings (7)
    'ghl_get_shipping_rates', 'ghl_create_shipping_rate', 'ghl_get_shipping_rate',
    'ghl_update_shipping_rate', 'ghl_delete_shipping_rate',
    'ghl_get_store_settings', 'ghl_update_store_settings',
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
    // Affiliate manager (4)
    'ghl_get_affiliates', 'ghl_get_affiliate', 'ghl_get_affiliate_commissions',
    'ghl_get_affiliate_payouts',
    // Email ISV (1)
    'ghl_verify_email',
    // Conversation AI (12)
    'ghl_create_conversation_ai_agent', 'ghl_search_conversation_ai_agents',
    'ghl_get_conversation_ai_agent', 'ghl_update_conversation_ai_agent',
    'ghl_delete_conversation_ai_agent', 'ghl_attach_conversation_ai_action',
    'ghl_list_conversation_ai_agent_actions', 'ghl_get_conversation_ai_agent_action',
    'ghl_update_conversation_ai_agent_action', 'ghl_remove_conversation_ai_agent_action',
    'ghl_update_conversation_ai_followup_settings', 'ghl_get_conversation_ai_generation',
    // Voice AI (11)
    'ghl_create_voice_ai_action', 'ghl_update_voice_ai_action', 'ghl_get_voice_ai_action',
    'ghl_delete_voice_ai_action', 'ghl_create_voice_ai_agent', 'ghl_get_voice_ai_agents',
    'ghl_update_voice_ai_agent', 'ghl_get_voice_ai_agent', 'ghl_delete_voice_ai_agent',
    'ghl_get_voice_ai_call_logs', 'ghl_get_voice_ai_call_log',
    // Chat Widget (8)
    'ghl_create_chat_widget', 'ghl_clone_chat_widget', 'ghl_get_chat_widget',
    'ghl_update_chat_widget', 'ghl_patch_chat_widget', 'ghl_list_chat_widgets',
    'ghl_get_chat_widget_config', 'ghl_delete_chat_widget',
    // Agent Studio (8)
    'ghl_create_agent_studio_agent', 'ghl_list_agent_studio_agents',
    'ghl_get_agent_studio_agent', 'ghl_update_agent_studio_agent_metadata',
    'ghl_delete_agent_studio_agent', 'ghl_update_agent_studio_agent_version',
    'ghl_publish_agent_studio_agent', 'ghl_execute_agent_studio_agent',
    // Social planner — content queues (18)
    'ghl_create_social_queue', 'ghl_get_social_queue_categories', 'ghl_list_social_queues',
    'ghl_get_social_queue_calendar', 'ghl_delete_social_queue_active_post', 'ghl_get_social_queue',
    'ghl_update_social_queue', 'ghl_create_social_queue_item', 'ghl_get_social_queue_edit_calendar',
    'ghl_discard_social_queue_edit', 'ghl_save_social_queue_edit', 'ghl_start_social_queue_edit',
    'ghl_get_social_queue_items', 'ghl_delete_social_queue_item', 'ghl_update_social_queue_item',
    'ghl_clone_social_queue_item', 'ghl_reset_social_queue_item', 'ghl_get_social_queue_slots',
    // Social planner — comments (4)
    'ghl_create_social_comment', 'ghl_list_social_comments', 'ghl_like_social_comment',
    'ghl_unlike_social_comment',
    // Social planner — accounts (9)
    'ghl_start_social_oauth', 'ghl_get_social_oauth_accounts', 'ghl_connect_social_oauth_account',
    'ghl_delete_social_account', 'ghl_set_social_accounts', 'ghl_get_social_categories',
    'ghl_get_social_category', 'ghl_get_social_tags', 'ghl_get_social_tags_by_ids',
    // Social planner — posts, CSV bulk-import, statistics (10)
    'ghl_upload_social_csv', 'ghl_get_social_csv_upload_status', 'ghl_get_social_csv_post',
    'ghl_finalize_social_csv', 'ghl_delete_social_csv', 'ghl_delete_social_csv_post',
    'ghl_bulk_delete_social_posts', 'ghl_get_social_post', 'ghl_update_social_post',
    'ghl_get_social_statistics',
    // Ad publishing — Facebook accounts, integration, pages (14)
    'ghl_get_facebook_ad_accounts', 'ghl_get_facebook_ad_account', 'ghl_delete_facebook_ad_account',
    'ghl_create_facebook_integration', 'ghl_get_facebook_integration', 'ghl_delete_facebook_integration',
    'ghl_get_facebook_me', 'ghl_get_facebook_entity', 'ghl_get_facebook_pages',
    'ghl_delete_facebook_page', 'ghl_set_default_facebook_page', 'ghl_get_facebook_page_forms',
    'ghl_create_facebook_page_form', 'ghl_get_facebook_page_instagram_accounts',
    // Ad publishing — Facebook campaign, ad set, and ad management (18)
    'ghl_get_facebook_campaign', 'ghl_upsert_facebook_campaign', 'ghl_delete_facebook_campaign',
    'ghl_duplicate_facebook_campaign', 'ghl_pause_facebook_campaign', 'ghl_publish_facebook_campaign',
    'ghl_get_facebook_campaign_publishing_progress', 'ghl_resume_facebook_campaign',
    'ghl_upsert_facebook_adset', 'ghl_delete_facebook_adset', 'ghl_duplicate_facebook_adset',
    'ghl_pause_facebook_adset', 'ghl_resume_facebook_adset',
    'ghl_upsert_facebook_ad', 'ghl_delete_facebook_ad', 'ghl_duplicate_facebook_ad',
    'ghl_pause_facebook_ad', 'ghl_resume_facebook_ad',
    // Ad publishing — Facebook custom audience, pixel, and lead form management (12)
    'ghl_get_facebook_custom_audiences', 'ghl_delete_facebook_custom_audience',
    'ghl_update_facebook_custom_audience', 'ghl_get_facebook_custom_audience',
    'ghl_add_facebook_custom_audience_member', 'ghl_remove_facebook_custom_audience_member',
    'ghl_batch_update_facebook_custom_audience_members', 'ghl_get_facebook_pixels',
    'ghl_upsert_facebook_pixel', 'ghl_get_facebook_conversation_forms',
    'ghl_create_facebook_conversation_form', 'ghl_get_facebook_lead_form',
    // Ad publishing — Facebook reporting and targeting search (4)
    'ghl_get_facebook_reporting', 'ghl_get_facebook_campaign_reporting',
    'ghl_get_facebook_reporting_list', 'ghl_search_facebook_targeting',
    // Ad publishing — Google ad account, integration, and identity management (7)
    'ghl_get_google_ad_accounts', 'ghl_get_google_ad_account', 'ghl_delete_google_ad_account',
    'ghl_create_google_integration', 'ghl_get_google_integration', 'ghl_get_google_me',
    'ghl_get_google_entity',
    // Ad publishing — Google campaign upsert, assets, and keyword research (6)
    'ghl_upsert_google_campaign', 'ghl_get_google_campaign', 'ghl_publish_google_campaign',
    'ghl_get_google_assets', 'ghl_upsert_google_assets', 'ghl_get_google_keyword_ideas',
    // Ad publishing — Google audience, segment, and conversion management (14)
    'ghl_upsert_google_audience', 'ghl_get_google_audiences', 'ghl_get_google_audience',
    'ghl_get_google_segments', 'ghl_upsert_google_segment',
    'ghl_create_google_offline_user_list_job', 'ghl_delete_google_segment',
    'ghl_get_google_segment', 'ghl_get_google_conversions', 'ghl_upsert_google_conversion',
    'ghl_get_google_conversion', 'ghl_delete_google_conversion',
    'ghl_get_google_conversion_goals', 'ghl_get_google_target_interests',
    // Ad publishing — Google reporting and targeting search (4)
    'ghl_get_google_reporting', 'ghl_get_google_campaign_reporting',
    'ghl_get_google_reporting_list', 'ghl_search_google_targeting',
    // Ad publishing — LinkedIn ad account, campaign, form, and reporting management (16)
    'ghl_get_linkedin_ad_account', 'ghl_delete_linkedin_ad_account',
    'ghl_get_linkedin_ad_accounts', 'ghl_create_linkedin_integration',
    'ghl_get_linkedin_integration', 'ghl_get_linkedin_me',
    'ghl_upsert_linkedin_campaign', 'ghl_get_linkedin_campaign',
    'ghl_publish_linkedin_campaign', 'ghl_update_linkedin_ad_status',
    'ghl_create_linkedin_lead_form', 'ghl_get_linkedin_lead_forms',
    'ghl_get_linkedin_reporting', 'ghl_get_linkedin_campaign_group_reporting',
    'ghl_get_linkedin_reporting_list', 'ghl_search_linkedin_targeting',
  ];

  it('all 404 expected tools are present', () => {
    expectedTools.forEach((name) => {
      expect(toolNames.has(name), `Missing tool: ${name}`).toBe(true);
    });
    expect(expectedTools).toHaveLength(411);
  });
});
