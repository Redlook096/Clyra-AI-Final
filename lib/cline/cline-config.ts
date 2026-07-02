import type { AgentMode } from "@cline/sdk";
import type { CoreSessionConfig } from "@cline/core";

export type ClineProviderConfig = {
  providerId: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
};

function readApiKeyFromEnv() {
  return (
    process.env.MY_LLM_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

export function hasUsableLlmApiKey(apiKey = readApiKeyFromEnv()) {
  if (!apiKey || !apiKey.trim()) return false;
  const normalized = apiKey.trim().toLowerCase();
  if (
    normalized.includes("placeholder") ||
    normalized.includes("your-key") ||
    normalized.includes("my_app_url") ||
    normalized === '""' ||
    normalized === "sk-test"
  ) {
    return false;
  }
  return normalized.length >= 12;
}

export function resolveClineProviderFromEnv(): ClineProviderConfig {
  const apiKey = readApiKeyFromEnv();

  if (process.env.MY_LLM_BASE_URL) {
    return {
      providerId: "openai-compatible",
      modelId: process.env.MY_LLM_MODEL || "deepseek-chat",
      apiKey,
      baseUrl: process.env.MY_LLM_BASE_URL,
    };
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return {
      providerId: "deepseek",
      modelId: process.env.MY_LLM_MODEL || "deepseek-chat",
      apiKey: process.env.DEEPSEEK_API_KEY,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      providerId: "anthropic",
      modelId: process.env.MY_LLM_MODEL || "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      providerId: "openai",
      modelId: process.env.MY_LLM_MODEL || "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  return {
    providerId: "openai-compatible",
    modelId: process.env.MY_LLM_MODEL || "deepseek-chat",
    apiKey,
  };
}

export function buildSessionConfig({
  workspacePath,
  mode,
  systemPrompt,
  provider = resolveClineProviderFromEnv(),
  yolo = true,
}: {
  workspacePath: string;
  mode: AgentMode;
  systemPrompt: string;
  provider?: ClineProviderConfig;
  yolo?: boolean;
}): CoreSessionConfig {
  return {
    providerId: provider.providerId,
    modelId: provider.modelId,
    ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
    ...(provider.baseUrl ? { baseUrl: provider.baseUrl } : {}),
    ...(provider.headers ? { headers: provider.headers } : {}),
    mode,
    cwd: workspacePath,
    workspaceRoot: workspacePath,
    enableTools: true,
    enableSpawnAgent: false,
    enableAgentTeams: false,
    yolo,
    systemPrompt,
    maxIterations: mode === "plan" ? 40 : 120,
    checkpoint: { enabled: true },
  };
}

export const PLAN_MODE_SYSTEM_PROMPT = `You are Cline running in Plan Mode for Clyra Vibe Coder.

Rules:
- Inspect the workspace with read/search/list tools before writing the plan.
- Plan Mode must NOT create or edit application source files. Only produce PLAN.md.
- Write a deep, product-specific PLAN.md — never a generic 3-section landing page plan.
- For vague prompts, derive a unique project fingerprint (request type, category, design direction, layout, colour mood, interaction style).
- Include: request summary, product type, target product, research summary, design direction, user flows, pages/sections, features, interactions, animations, responsive behaviour, state/data needs, file plan, tool strategy, validation checklist, acceptance test.
- For real companies/brands, use web research tools when available and capture style direction only — never copy protected assets.
- Wait for user approval before any code is written.`;

export const CODE_MODE_SYSTEM_PROMPT = `You are Cline running in Act/Code Mode for Clyra Vibe Coder.

Rules:
- Read PLAN.md first, then inspect the project repeatedly — do not guess from one pass.
- Build the complete product: navigation, pages, auth UI, forms, modals, states, responsive layout, animations, realistic content.
- Create/edit/revisit files dynamically; group connected edits (navbar + auth modal + CTA together).
- Run terminal validation (build/lint) and fix errors before finishing.
- Do not stop after 3–4 files or one screen. Revisit files for polish and interaction wiring.
- Use React + Vite + TypeScript with separate component files — never a single index.html demo unless PLAN.md explicitly requires static HTML only.
- Never use hardcoded templates. Build what PLAN.md and the user request describe literally.`;
