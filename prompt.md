{
  "task": "Finalize and implement listing lifecycle, lead lifecycle, and appointment lifecycle for Eain Chan Myay MVP.",
  "project_context": {
    "app": "Eain Chan Myay",
    "stack": "Next.js + styled-components + Supabase",
    "product": "Multi-vendor real estate platform for Myanmar agencies",
    "goal": "Create clean lifecycle handling for listings, leads, and appointments so agency CRM, analytics, and status actions work consistently."
  },
  "core_rule": {
    "important": "Do not mix listing status, lead status, and appointment status.",
    "listing_status": "Availability/publication status of the property record.",
    "lead_status": "Customer/inquiry journey status.",
    "appointment_status": "Viewing schedule status.",
    "example": "A listing can be active while one lead is lost, another lead is contacted, and another lead has an appointment scheduled."
  },
  "listing_statuses": [
    "draft",
    "active",
    "paused",
    "reserved",
    "sold",
    "rented",
    "expired",
    "archived",
    "rejected"
  ],
  "listing_status_meaning": {
    "draft": "Listing is incomplete or not ready to publish.",
    "active": "Listing is public and available.",
    "paused": "Agency temporarily hides the listing from public view.",
    "reserved": "Serious buyer/renter process is happening, but deal is not completed.",
    "sold": "Sale completed.",
    "rented": "Rental completed.",
    "expired": "Listing duration/package limit ended.",
    "archived": "Removed from active operations but kept for records.",
    "rejected": "Platform/admin rejected the listing."
  },
  "listing_transitions": {
    "draft": ["active", "archived"],
    "active": ["paused", "reserved", "sold", "rented", "expired", "archived"],
    "paused": ["active", "archived"],
    "reserved": ["active", "sold", "rented", "archived"],
    "expired": ["active", "archived"],
    "rejected": ["draft", "archived"],
    "sold": ["archived"],
    "rented": ["archived"],
    "archived": ["draft"]
  },
  "listing_public_visibility": {
    "draft": false,
    "active": true,
    "paused": false,
    "reserved": true,
    "sold": false,
    "rented": false,
    "expired": false,
    "archived": false,
    "rejected": false
  },
  "lead_statuses": [
    "new",
    "assigned",
    "contacted",
    "qualified",
    "appointment_scheduled",
    "viewed",
    "negotiation",
    "closed_won",
    "closed_lost",
    "unresponsive",
    "spam"
  ],
  "lead_status_meaning": {
    "new": "Inquiry received, not handled yet.",
    "assigned": "Lead assigned to an agent.",
    "contacted": "Agent contacted the customer.",
    "qualified": "Customer is serious and matches budget/need.",
    "appointment_scheduled": "Viewing appointment has been scheduled.",
    "viewed": "Customer attended the viewing.",
    "negotiation": "Price/terms discussion is happening.",
    "closed_won": "Deal completed successfully.",
    "closed_lost": "Lead did not convert.",
    "unresponsive": "Customer stopped replying.",
    "spam": "Fake, duplicate, invalid, or irrelevant lead."
  },
  "lead_transitions": {
    "new": ["assigned", "contacted", "unresponsive", "spam"],
    "assigned": ["contacted", "unresponsive", "spam"],
    "contacted": ["qualified", "appointment_scheduled", "closed_lost", "unresponsive"],
    "qualified": ["appointment_scheduled", "negotiation", "closed_lost", "unresponsive"],
    "appointment_scheduled": ["viewed", "negotiation", "closed_lost", "unresponsive"],
    "viewed": ["negotiation", "closed_won", "closed_lost"],
    "negotiation": ["closed_won", "closed_lost", "unresponsive"],
    "closed_won": [],
    "closed_lost": [],
    "unresponsive": ["contacted", "closed_lost"],
    "spam": []
  },
  "appointment_statuses": [
    "requested",
    "confirmed",
    "completed",
    "cancelled",
    "no_show"
  ],
  "appointment_status_meaning": {
    "requested": "Customer requested a viewing.",
    "confirmed": "Agency/agent confirmed the appointment.",
    "completed": "Viewing happened.",
    "cancelled": "Appointment was cancelled.",
    "no_show": "Customer did not attend."
  },
  "appointment_transitions": {
    "requested": ["confirmed", "cancelled"],
    "confirmed": ["completed", "cancelled", "no_show"],
    "completed": [],
    "cancelled": [],
    "no_show": []
  },
  "lead_sources": [
    "listing_detail_form",
    "phone_click",
    "whatsapp_click",
    "messenger_click",
    "appointment_request",
    "hero_ad",
    "search_boost",
    "category_boost",
    "manual_entry",
    "imported"
  ],
  "lead_priorities": [
    "low",
    "normal",
    "high",
    "urgent"
  ],
  "lost_reasons": [
    "price_too_high",
    "location_not_suitable",
    "property_not_available",
    "customer_unresponsive",
    "bought_or_rented_elsewhere",
    "budget_mismatch",
    "duplicate_lead",
    "fake_or_spam",
    "other"
  ],
  "closed_outcomes": [
    "sold",
    "rented"
  ],
  "business_rules": [
    "Do not change listing status when one lead is closed_lost.",
    "Do not mark listing as reserved just because a customer asked a question.",
    "Only mark listing as reserved when there is serious buying/renting progress such as deposit, owner acceptance, or contract preparation.",
    "Only mark listing as sold or rented after deal completion.",
    "Appointment status changes should affect lead status, not listing status.",
    "When appointment is confirmed, lead may become appointment_scheduled.",
    "When appointment is completed, lead may become viewed.",
    "Expired listings must not delete leads.",
    "Archived listings should not be public but should keep historical lead and analytics records.",
    "When lead becomes closed_won, ask/allow agency to optionally mark related listing as sold or rented.",
    "Do not auto-close listing if listing may represent multiple units."
  ],
  "relationship_model": {
    "listing": "has many leads",
    "lead": "belongs to one listing and may have one or many appointments",
    "appointment": "belongs to one lead, one listing, and optionally one assigned agent"
  },
  "required_data_fields": {
    "listings": [
      "status",
      "published_at",
      "expires_at",
      "reserved_at",
      "closed_at",
      "archived_at",
      "rejection_reason"
    ],
    "leads": [
      "status",
      "source",
      "priority",
      "assigned_agent_id",
      "first_response_at",
      "last_contacted_at",
      "closed_at",
      "lost_reason",
      "closed_outcome"
    ],
    "appointments": [
      "status",
      "scheduled_at",
      "assigned_agent_id",
      "completed_at",
      "cancelled_reason",
      "notes"
    ]
  },
  "ui_requirements": {
    "listing_management": [
      "Show status badge on each listing.",
      "Show allowed actions based on current listing status.",
      "Active listings can be paused, reserved, sold, rented, promoted, or archived.",
      "Paused listings can be republished or archived.",
      "Reserved listings can return to active or be marked sold/rented.",
      "Sold/rented listings can be archived.",
      "Expired listings can be renewed or archived."
    ],
    "lead_inbox": [
      "Show customer name, listing title, source, status, priority, assigned agent, created time, and last contacted time.",
      "Allow status changes using valid lifecycle transitions.",
      "Allow assigning lead to an agent.",
      "Allow marking contacted, qualified, appointment scheduled, viewed, negotiation, closed won, closed lost, unresponsive, or spam."
    ],
    "appointment_page": [
      "Show listing, customer, agent, date/time, status, and notes.",
      "Allow confirm, complete, cancel, and mark no-show based on valid transitions."
    ]
  },
  "analytics_support": {
    "listing_analytics": [
      "active listings",
      "paused listings",
      "expired listings",
      "reserved listings",
      "sold/rented listings",
      "average days to close",
      "listings with high views but low leads",
      "listings with many leads but no appointment"
    ],
    "lead_analytics": [
      "new leads",
      "unanswered leads",
      "lead response time",
      "lead-to-appointment rate",
      "appointment-to-close rate",
      "closed won rate",
      "lost reasons",
      "lead source performance"
    ],
    "appointment_analytics": [
      "requested appointments",
      "confirmed appointments",
      "completed appointments",
      "cancelled appointments",
      "no-show rate",
      "most requested listings"
    ]
  },
  "implementation_rules": [
    "Inspect existing listing, lead, and appointment models before editing.",
    "Reuse existing enums/types if they already exist and update them carefully.",
    "Add migrations only if needed.",
    "Do not break existing listing creation/editing flow.",
    "Do not break existing lead inbox or appointment flow.",
    "Use strict TypeScript types.",
    "Use Supabase-safe enum/text handling based on existing project pattern.",
    "Do not hardcode agency IDs.",
    "Do not implement analytics UI in this task unless required for lifecycle fields.",
    "Do not implement Dinger/payment in this task.",
    "Do not implement map feature in this task.",
    "Avoid large unrelated refactors.",
    "Touch minimum files."
  ],
  "deliverables": [
    "List exact files changed.",
    "Summarize lifecycle statuses added/updated.",
    "Summarize database changes or migrations.",
    "Summarize UI/actions changed.",
    "Mention any compatibility risks.",
    "Mention TODOs left.",
    "Run typecheck/build if available and report result."
  ]
}