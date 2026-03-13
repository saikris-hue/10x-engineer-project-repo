import type { Collection, Prompt } from "../types/api";

export const demoCollections: Collection[] = [
  {
    id: "col-product",
    name: "Product Launch",
    description: "Prompts for launch planning, messaging, and QA.",
    created_at: "2026-03-01T09:00:00",
  },
  {
    id: "col-support",
    name: "Customer Support",
    description: "Saved prompts for support escalations and summaries.",
    created_at: "2026-03-02T11:30:00",
  },
];

export const demoPrompts: Prompt[] = [
  {
    id: "prompt-001",
    title: "Launch Recap Generator",
    content:
      "You are an operations analyst. Summarize the launch timeline, blockers, and risks in a concise internal update.",
    description: "Generates a concise launch recap for internal stakeholders.",
    collection_id: "col-product",
    created_at: "2026-03-05T08:15:00",
    updated_at: "2026-03-07T14:45:00",
  },
  {
    id: "prompt-002",
    title: "Support Escalation Triage",
    content:
      "Review the customer report, classify severity, identify likely product area, and produce the next-action checklist.",
    description: "Triage template for inbound support issues.",
    collection_id: "col-support",
    created_at: "2026-03-04T10:20:00",
    updated_at: "2026-03-08T16:10:00",
  },
  {
    id: "prompt-003",
    title: "Standalone Prompt Audit",
    content:
      "Inspect this prompt for ambiguity, verbosity, and missing constraints. Suggest a cleaner final version.",
    description: "Prompt review helper not assigned to any collection.",
    collection_id: null,
    created_at: "2026-03-03T12:00:00",
    updated_at: "2026-03-06T09:25:00",
  },
];
