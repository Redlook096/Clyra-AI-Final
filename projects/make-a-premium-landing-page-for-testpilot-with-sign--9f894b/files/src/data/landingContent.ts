export const navLinks = ["Product", "Plan Mode", "Preview", "Pricing", "FAQ"];

export const trustPills = [
  "Plan-first agent",
  "Live preview",
  "Terminal-aware",
  "Checkpointed builds",
];

export const features = [
  {
    title: "Deep Plan Mode",
    copy: "TestPilot turns messy requests into a structured PLAN.md with file targets, task dependencies, checks, and rollback points.",
  },
  {
    title: "One-file streaming",
    copy: "Every important file change appears one at a time with compact code cards, diffs, reasons, and clear completion states.",
  },
  {
    title: "Live preview loop",
    copy: "The generated app runs inside a browser-style preview so you can inspect the real interface while the agent keeps building.",
  },
  {
    title: "Terminal fixes",
    copy: "Build output, errors, and command logs stay visible, letting the agent patch the exact file instead of guessing.",
  },
  {
    title: "Project memory",
    copy: "Projects save with metadata, checkpoints, plans, logs, and preview-ready files so reopening never replays old generation.",
  },
  {
    title: "Model flexibility",
    copy: "Use your own LLM backend while keeping a premium coding workspace with predictable controls and transparent steps.",
  },
  {
    title: "Responsive apps",
    copy: "Every generated interface is checked against desktop, tablet, and mobile layouts with real production states.",
  },
  {
    title: "Error recovery",
    copy: "Runtime or build failures are treated as tasks: read the issue, patch the file, rerun checks, refresh preview.",
  },
  {
    title: "Ship review",
    copy: "Final review verifies saved files, preview health, task completion, and rollback before the build is marked ready.",
  },
];

export const workflow = [
  ["Prompt", "Describe the app, page, or fix you want."],
  ["Plan", "Review PLAN.md with architecture, file queue, and validation gates."],
  ["Code", "Watch files stream one by one with mini code boxes and diffs."],
  ["Check", "Run build and terminal checks, then fix errors in context."],
  ["Preview", "Inspect the live app in desktop, tablet, or mobile mode."],
  ["Ship", "Checkpoint, review, and export a polished project."],
];

export const pricing = [
  {
    name: "Starter",
    price: "$19",
    copy: "For solo builders validating polished ideas quickly.",
    perks: ["Plan Mode", "Live preview", "5 active projects", "Local export"],
  },
  {
    name: "Pro",
    price: "$49",
    copy: "For developers shipping full app surfaces with confidence.",
    perks: ["Unlimited projects", "Terminal repair loop", "Checkpoint history", "Priority generation"],
    featured: true,
  },
  {
    name: "Team",
    price: "Custom",
    copy: "For product teams standardising agentic app building.",
    perks: ["Shared workspaces", "Design system rules", "Review gates", "Admin controls"],
  },
];

export const faqs = [
  ["What is TestPilot?", "TestPilot is an AI coding platform that plans, writes files, runs checks, previews the app, fixes errors, and keeps project state saved."],
  ["Does it use Plan Mode?", "Yes. Plan Mode creates a reviewable PLAN.md before code changes start, then builds from that plan task by task."],
  ["Can it build full apps?", "It is designed for complete product surfaces: routes, components, states, responsive layouts, and validation, not tiny throwaway demos."],
  ["Does it show live preview?", "Yes. The app runs in a browser-style preview with refresh, device controls, error states, and real localhost output."],
  ["Can it fix errors?", "Build and runtime errors are captured, mapped to files, patched, and checked again before the task continues."],
  ["Can I export the code?", "Generated files are saved as normal project files with README, metadata, checkpoints, and logs so you can inspect or move them."],
];
