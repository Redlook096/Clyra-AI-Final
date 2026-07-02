/**
 * History manager - tracks calculation history.
 */
class HistoryManager {
  constructor(panelEl, listEl, onEntryClick) {
    this.panelEl = panelEl;
    this.listEl = listEl;
    this.onEntryClick = onEntryClick || (() => {});
    this.history = [];
    this.isOpen = false;
  }

  /**
   * Add a calculation to history.
   */
  addEntry(expression, result) {
    this.history.unshift({ expression, result, id: Date.now() });
    this.render();
  }

  /**
   * Clear all history.
   */
  clear() {
    this.history = [];
    this.render();
  }

  /**
   * Toggle the history panel.
   */
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.panelEl.classList.add('open');
    } else {
      this.panelEl.classList.remove('open');
    }
    return this.isOpen;
  }

  /**
   * Close the history panel.
   */
  close() {
    this.isOpen = false;
    this.panelEl.classList.remove('open');
  }

  /**
   * Render history entries.
   */
  render() {
    if (this.history.length === 0) {
      this.listEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    this.listEl.innerHTML = this.history.map(entry => `
      <div class="history-item" data-id="${entry.id}">
        <span class="history-item-expression">${this._escapeHtml(entry.expression)}</span>
        <span class="history-item-result">= ${this._escapeHtml(String(entry.result))}</span>
      </div>
    `).join('');

    // Attach click handlers
    this.listEl.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const entry = this.history.find(h => h.id === id);
        if (entry && this.onEntryClick) {
          this.onEntryClick(entry);
        }
      });
    });
  }

  /**
   * Escape HTML special characters.
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
