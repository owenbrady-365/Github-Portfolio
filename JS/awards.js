document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.awards-grid');
  const select = document.getElementById('sort-select');

  // Level priority (lower = higher priority)
  const LEVEL_ORDER = {
    scholarship: 1,
    award: 2,
    diploma: 3,
    certificate: 4,
    honor: 5,
    other: 99
  };

  function parseDate(attr) {
    return attr ? new Date(attr) : new Date(0);
  }

  function compareByLevel(a, b) {
    const la = a.dataset.level || 'other';
    const lb = b.dataset.level || 'other';
    const pa = LEVEL_ORDER[la] ?? LEVEL_ORDER.other;
    const pb = LEVEL_ORDER[lb] ?? LEVEL_ORDER.other;
    if (pa !== pb) return pa - pb; // lower first
    // tie-breaker: newest first
    return parseDate(b.dataset.date) - parseDate(a.dataset.date);
  }

  function compareByDate(a, b) {
    const da = parseDate(a.dataset.date);
    const db = parseDate(b.dataset.date);
    if (db - da !== 0) return db - da; // newest first
    // tie-breaker: level
    return compareByLevel(a, b);
  }

  function sortAwards(criteria) {
    const items = Array.from(grid.querySelectorAll('.award-card'));
    items.sort(criteria === 'date' ? compareByDate : compareByLevel);
    // Re-append in sorted order
    items.forEach(item => grid.appendChild(item));
  }

  select.addEventListener('change', (e) => {
    sortAwards(e.target.value);
    // Announce sorting change for assistive tech
    grid.setAttribute('aria-label', `Sorted by ${e.target.selectedOptions[0].text}`);
  });

  // Apply default sort (level)
  sortAwards('level');
});