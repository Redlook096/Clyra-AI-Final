export class ProductArchitectAgent {
  /**
   * Generates a context injection string to force the LLM to think like a product architect
   * rather than a simple script generator.
   */
  static getArchitectPromptExpansion(goal: string): string {
    const isLandingPage = /landing|home|website|marketing/i.test(goal);
    const isDashboard = /dashboard|admin|portal|crm/i.test(goal);
    const isApp = /app|saas|platform/i.test(goal);

    let expansion = `
YOU ARE A PRODUCT ARCHITECT. Do not just build the bare minimum requested.
Expand the user's request into a FULL, PREMIUM product build.
`;

    if (isLandingPage) {
      expansion += `
For this Landing Page, you MUST plan:
- Route/page shell
- Premium Navigation Bar (with responsive mobile menu)
- Hero section with clear CTA
- Social proof / Brand section
- Feature/Value sections
- Login/Signup entry points (auth scaffold)
- Premium Footer
- Responsive layout (mobile, tablet, desktop)
- Hover/focus/disabled states for all interactives
`;
    } else if (isDashboard) {
      expansion += `
For this Dashboard, you MUST plan:
- Sidebar / Topbar navigation
- Overview metrics cards
- Chart/Data placeholders
- Data table or list view
- Search and filter inputs
- Settings/Profile link
- Empty states, loading states, error states
- Responsive layout
`;
    } else if (isApp) {
      expansion += `
For this App, you MUST plan:
- Auth scaffold / Onboarding
- App shell and routing
- Dashboard view
- Data models and API route placeholders
- Settings
- Premium loading/error states
- Security considerations
`;
    }

    expansion += `
DO NOT put everything in one file. Break this down into proper reusable components.
DO NOT use generic colors. Use premium, glassy, modern styling.
DO NOT auto-approve. Make sure the plan.md reflects this deep architecture.
`;

    return expansion;
  }
}
