import "./styles.css";
import { siteContent } from "./content.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="site-nav" data-nav>
    <a class="brand" href="#top" aria-label="Open home">
      <span class="brand-mark">AI</span>
      <span>OpenAI</span>
    </a>
    <nav class="desktop-links" aria-label="Primary navigation">
      ${siteContent.nav.map((item) => `<a href="#${item.toLowerCase().replace(/\s+/g, "-")}">${item}</a>`).join("")}
    </nav>
    <div class="nav-actions">
      <button class="ghost-button" data-scroll="#products">Explore</button>
      <button class="solid-button" data-open-modal>Start building</button>
      <button class="menu-button" aria-label="Open menu" aria-expanded="false" data-menu-button>
        <span></span><span></span>
      </button>
    </div>
  </header>

  <div class="mobile-menu" data-mobile-menu>
    ${siteContent.nav.map((item) => `<a href="#${item.toLowerCase().replace(/\s+/g, "-")}">${item}</a>`).join("")}
  </div>

  <main id="top">
    <section class="hero section">
      <div class="hero-copy reveal">
        <p class="eyebrow">${siteContent.eyebrow}</p>
        <h1>${siteContent.title}</h1>
        <p class="hero-subtitle">${siteContent.subtitle}</p>
        <div class="hero-actions">
          <button class="solid-button large" data-open-modal>Start with AI</button>
          <button class="ghost-button large" data-scroll="#products">View products</button>
        </div>
        <div class="trust-row" aria-label="Public product focus areas">
          <span>ChatGPT</span><span>API</span><span>Codex</span><span>Safety</span>
        </div>
      </div>
      <div class="hero-panel reveal delay-1" aria-label="AI platform preview">
        <div class="panel-top"><span></span><span></span><span></span></div>
        <div class="model-orbit">
          <div class="orb"></div>
          <div class="signal signal-one"></div>
          <div class="signal signal-two"></div>
        </div>
        <div class="agent-card">
          <p>Agent plan</p>
          <strong>Research → plan → code → validate</strong>
        </div>
        <div class="metric-grid">
          <div><strong>4</strong><span>product lanes</span></div>
          <div><strong>24/7</strong><span>assistant surface</span></div>
          <div><strong>API</strong><span>developer layer</span></div>
        </div>
      </div>
    </section>

    <section class="section product-preview" id="products">
      <div class="section-heading reveal">
        <p class="eyebrow">Product ecosystem</p>
        <h2>One calm page for the ways teams build with AI.</h2>
        <p>${siteContent.note}</p>
      </div>
      <div class="product-grid">
        ${siteContent.productCards.map((card, index) => `
          <article class="product-card reveal delay-${(index % 3) + 1}">
            <span class="card-index">0${index + 1}</span>
            <h3>${card.title}</h3>
            <p>${card.text}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="section split-section" id="api">
      <div class="section-heading reveal">
        <p class="eyebrow">For developers</p>
        <h2>From prompt to product with cleaner loops.</h2>
      </div>
      <div class="code-window reveal delay-1">
        <div class="code-line"><span>01</span>create plan.md</div>
        <div class="code-line"><span>02</span>generate focused files</div>
        <div class="code-line"><span>03</span>run validation</div>
        <div class="code-line"><span>04</span>preview and improve</div>
      </div>
      <div class="feature-list reveal delay-2">
        ${siteContent.features.map((item) => `<div class="feature-pill">${item}</div>`).join("")}
      </div>
    </section>

    <section class="section workflow" id="codex">
      <div class="section-heading reveal">
        <p class="eyebrow">Agentic workflow</p>
        <h2>A product story that feels fast, careful, and useful.</h2>
      </div>
      <div class="workflow-row">
        ${["Ask", "Plan", "Build", "Check", "Preview", "Ship"].map((step, index) => `
          <div class="workflow-step reveal delay-${(index % 3) + 1}">
            <span>${index + 1}</span>
            <strong>${step}</strong>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="section faq-section" id="safety">
      <div class="section-heading reveal">
        <p class="eyebrow">Clarity and safety</p>
        <h2>Transparent boundaries for a real-company inspired concept.</h2>
      </div>
      <div class="faq-list">
        ${siteContent.faqs.map((item, index) => `
          <article class="faq-item reveal delay-${(index % 3) + 1}">
            <button aria-expanded="false" data-faq>
              <span>${item.q}</span>
              <strong>+</strong>
            </button>
            <p>${item.a}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="section cta-section" id="business">
      <div class="cta-card reveal">
        <p class="eyebrow">Ready state</p>
        <h2>Build responsibly with an AI workflow that checks its work.</h2>
        <button class="solid-button large" data-open-modal>Request access</button>
      </div>
    </section>
  </main>

  <footer class="footer">
    <span>OpenAI inspired concept</span>
    <span>Unofficial demo · built in Vibe Coder</span>
  </footer>

  <div class="modal-backdrop" data-modal hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-close-modal aria-label="Close">×</button>
      <p class="eyebrow">Demo form</p>
      <h2 id="modal-title">Start building with AI</h2>
      <form data-form novalidate>
        <label>Email<input type="email" name="email" placeholder="you@company.com" required /></label>
        <label>Use case<textarea name="usecase" placeholder="Tell us what you want to build" required></textarea></label>
        <p class="form-error" data-form-error></p>
        <button class="solid-button" type="submit">Submit request</button>
      </form>
    </div>
  </div>
`;

const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const modal = document.querySelector("[data-modal]");
const form = document.querySelector("[data-form]");
const formError = document.querySelector("[data-form-error]");

menuButton?.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" }));
});

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
  });
});

document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

function closeModal() {
  modal.classList.remove("open");
  setTimeout(() => { modal.hidden = true; }, 180);
}

document.querySelectorAll("[data-faq]").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const open = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.querySelector("strong").textContent = open ? "−" : "+";
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "");
  const usecase = String(data.get("usecase") || "");
  if (!email.includes("@") || usecase.trim().length < 8) {
    formError.textContent = "Add a valid email and a short use case before submitting.";
    return;
  }
  formError.textContent = "Request captured locally for this demo.";
  form.reset();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));
