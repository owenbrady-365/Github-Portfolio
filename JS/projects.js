// Project filtering and sorting functionality
document.addEventListener('DOMContentLoaded', () => {
  const projectCards = document.querySelectorAll('.project-card');
  const sortSelect = document.getElementById('sort-select');
  const categoryFilter = document.getElementById('category-filter');

  // Detect image aspect ratio and apply layout class to hover card
  function setupImageOrientations() {
    projectCards.forEach(card => {
      const hoverImg = card.querySelector('.hover-image');
      const hoverCard = card.querySelector('.project-hover-card');
      
      if (hoverImg && hoverCard) {
        hoverImg.onload = () => {
          const width = hoverImg.naturalWidth;
          const height = hoverImg.naturalHeight;
          const aspectRatio = width / height;
          
          // Remove existing layout classes
          hoverCard.classList.remove('horizontal', 'portrait');
          
          // Add appropriate layout class based on aspect ratio
          // If wider than tall (aspect ratio > 1.2), use horizontal layout
          // Otherwise use portrait layout for vertical or near-square images
          if (aspectRatio > 1.2) {
            hoverCard.classList.add('horizontal');
          } else {
            hoverCard.classList.add('portrait');
          }
        };
        
        // Handle case where image is already cached/loaded
        if (hoverImg.complete) {
          hoverImg.onload();
        }
      }
    });
  }

  // Sort and filter functionality
  function filterAndSortProjects() {
    const sortValue = sortSelect.value;
    const categoryValue = categoryFilter.value;

    // Convert NodeList to Array for sorting
    const cardsArray = Array.from(projectCards);

    // Filter by category
    cardsArray.forEach(card => {
      const categories = card.dataset.category.split(' ');
      const shouldShow = categoryValue === 'all' || categories.includes(categoryValue);
      card.style.display = shouldShow ? 'flex' : 'none';
    });

    // Sort the visible cards
    const visibleCards = cardsArray.filter(card => card.style.display !== 'none');
    
    visibleCards.sort((a, b) => {
      switch (sortValue) {
        case 'date':
          return new Date(b.dataset.date) - new Date(a.dataset.date);
        case 'complexity':
          return parseInt(b.dataset.complexity) - parseInt(a.dataset.complexity);
        case 'name':
          const titleA = a.dataset.title || a.querySelector('.project-title-overlay')?.textContent || '';
          const titleB = b.dataset.title || b.querySelector('.project-title-overlay')?.textContent || '';
          return titleA.localeCompare(titleB);
        default:
          return 0;
      }
    });

    // Reorder the grid by moving elements
    const grid = document.querySelector('.projects-grid');
    visibleCards.forEach(card => {
      grid.appendChild(card);
    });
  }

  // Event listeners
  sortSelect.addEventListener('change', filterAndSortProjects);
  categoryFilter.addEventListener('change', filterAndSortProjects);

  // Initialize image orientations
  setupImageOrientations();

  // Initialize with default sorting
  filterAndSortProjects();

  /* ------------------ Micro-preview and Dock interactions ------------------ */
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  // create micro-preview for each card based on description and tags
  projectCards.forEach(card => {
    const descEl = card.querySelector('.project-description');
    const descText = (card.dataset.descriptor || (descEl ? descEl.textContent.trim() : '')).slice(0, 220);
    const tags = (card.dataset.tags || card.dataset.category || '').split(/[ ,]+/).filter(Boolean).slice(0,6);

    const micro = document.createElement('div');
    micro.className = 'micro-preview';
    micro.innerHTML = `<div class="descriptor">${escapeHtml(descText).slice(0,45)}</div><div class="tag-list"></div>`;
    const tagList = micro.querySelector('.tag-list');
    tags.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'skill-chip';
      chip.textContent = t.toUpperCase();
      tagList.appendChild(chip);
    });
    card.appendChild(micro);

    // ensure each card has a small bottom title overlay for idle state
    const imgWrap = card.querySelector('.project-image-wrap');
    if (imgWrap && !imgWrap.querySelector('.project-title-overlay')) {
      const titleText = card.dataset.title || card.querySelector('.project-title-overlay')?.textContent || '';
      const overlay = document.createElement('div');
      overlay.className = 'project-title-overlay';
      overlay.textContent = titleText;
      imgWrap.appendChild(overlay);
    }

    // hover / pointer interactions (desktop)
    let showTimer = null;
    card.addEventListener('pointerenter', () => {
      if (isTouch) return;
      showTimer = setTimeout(() => micro.classList.add('show'), 120);
    });
    card.addEventListener('pointerleave', () => {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      micro.classList.remove('show');
    });

    // click/touch behavior
    card.addEventListener('click', (e) => {
      // on touch devices first tap should reveal micro-preview, second tap opens dock
      if (isTouch) {
        if (!micro.classList.contains('show')) {
          // show micro-preview and stop propagation
          micro.classList.add('show');
          // small timeout to allow user to tap again to open dock
          setTimeout(() => {}, 50);
          e.preventDefault();
          return;
        }
      }
      // otherwise open dock
      openDockForCard(card);
    });
  });

  // Create references to dock/backdrop elements
  const dock = document.getElementById('project-dock');
  const dockBackdrop = document.getElementById('dock-backdrop');
  const dockHeroImg = document.getElementById('dock-hero-img');
  const dockTitle = document.getElementById('dock-title');
  const dockOverview = document.getElementById('dock-overview');
  const dockTags = document.getElementById('dock-tags');
  const dockStats = document.getElementById('dock-stats');
  const dockActions = document.getElementById('dock-actions');

  function openDockForCard(card) {
    // hide any micro-preview on this card
    const mp = card.querySelector('.micro-preview'); if (mp) mp.classList.remove('show');
    // populate dock content
    const img = card.querySelector('.project-image');
    const title = card.dataset.title || card.querySelector('.project-title-overlay')?.textContent || '';
    // Prefer data-attributes for dock content, fall back to hidden elements
    const overview = card.dataset.descriptor || card.querySelector('.project-description')?.textContent || '';
    const meta = card.dataset.meta || card.querySelector('.project-meta')?.textContent || '';
    const actionsLink = card.dataset.link || card.querySelector('.hover-link')?.getAttribute('href') || '#';

    dockHeroImg.src = img ? img.src : '';
    dockHeroImg.alt = title;
    dockTitle.textContent = title;
    dockOverview.textContent = overview;

    // tags
    dockTags.innerHTML = '';
    const tags = (card.dataset.tags || card.dataset.category || '').split(/[ ,]+/).filter(Boolean).slice(0,8);
    tags.forEach(t => {
      const s = document.createElement('span'); s.className = 'skill-chip'; s.textContent = t.toUpperCase(); dockTags.appendChild(s);
    });

    // stats
    dockStats.innerHTML = '';
    const statItems = [];
    if (meta) statItems.push(meta);
    if (card.dataset.complexity) statItems.push('Complexity: ' + card.dataset.complexity + '/10');
    if (card.dataset.date) statItems.push('Date: ' + card.dataset.date);
    if (card.dataset.duration) statItems.push('Duration: ' + card.dataset.duration);
    if (card.dataset.status) statItems.push('Status: ' + card.dataset.status);
    statItems.forEach(s => { const el = document.createElement('div'); el.textContent = s; dockStats.appendChild(el); });

    // Extra info sections (team, role, tools, results, status)
    const dockTeamSection = document.getElementById('dock-team-section');
    const dockRoleSection = document.getElementById('dock-role-section');
    const dockToolsSection = document.getElementById('dock-tools-section');
    const dockResultsSection = document.getElementById('dock-results-section');
    const dockStatusSection = document.getElementById('dock-status-section');
    
    // Team
    if (card.dataset.team) {
      document.getElementById('dock-team').textContent = card.dataset.team;
      dockTeamSection.style.display = 'block';
    } else {
      dockTeamSection.style.display = 'none';
    }
    
    // Role
    if (card.dataset.role) {
      document.getElementById('dock-role').textContent = card.dataset.role;
      dockRoleSection.style.display = 'block';
    } else {
      dockRoleSection.style.display = 'none';
    }
    
    // Tools
    if (card.dataset.tools) {
      document.getElementById('dock-tools').textContent = card.dataset.tools;
      dockToolsSection.style.display = 'block';
    } else {
      dockToolsSection.style.display = 'none';
    }
    
    // Results
    if (card.dataset.results) {
      document.getElementById('dock-results').textContent = card.dataset.results;
      dockResultsSection.style.display = 'block';
    } else {
      dockResultsSection.style.display = 'none';
    }
    
    /*   
    Status
    if (card.dataset.status) {
      document.getElementById('dock-status').textContent = card.dataset.status;
      dockStatusSection.style.display = 'block';
    } else {
      dockStatusSection.style.display = 'none';
    } 
      */

    // actions
    dockActions.innerHTML = '';
    const viewLink = document.createElement('a');
    viewLink.className = 'hover-link';
    viewLink.href = actionsLink;
    viewLink.textContent = 'View Full Case Study →';
    dockActions.appendChild(viewLink);

    // determine orientation for dock (portrait if image taller than wide)
    dock.classList.remove('portrait');
    try {
      const iw = img ? img.naturalWidth || img.width : 1;
      const ih = img ? img.naturalHeight || img.height : 1;
      const ar = iw / ih;
      if (ar <= 1.2) {
        dock.classList.add('portrait');
      }
    } catch (e) {}

    // show dock and backdrop
    dock.classList.add('open');
    dockBackdrop.classList.add('show');
    dock.setAttribute('aria-hidden','false');
    dockBackdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');

    // highlight origin card
    projectCards.forEach(c => c.classList.remove('origin-highlight'));
    card.classList.add('origin-highlight');
  }

  function closeDock() {
    dock.classList.remove('open');
    dockBackdrop.classList.remove('show');
    dock.setAttribute('aria-hidden','true');
    dockBackdrop.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    projectCards.forEach(c => c.classList.remove('origin-highlight'));
  }

  // close controls
  dockBackdrop.addEventListener('click', closeDock);
  const closeBtn = dock.querySelector('.close-dock');
  closeBtn.addEventListener('click', closeDock);

  // utility: escapeHtml
  function escapeHtml(str){ return String(str).replace(/[&<>"]+/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s])); }

  /* -------------------- Masonry Layout -------------------- */
  function initMasonry() {
    const grid = document.querySelector('.projects-grid');
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    
    // Wait for images to load before calculating layout
    let loadedCount = 0;
    const totalCards = cards.length;
    
    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalCards) {
        layoutMasonry();
      }
    };
    
    cards.forEach(card => {
      const img = card.querySelector('.project-image');
      if (img.complete) {
        loadedCount++;
      } else {
        img.addEventListener('load', onImageLoad);
        img.addEventListener('error', onImageLoad);
      }
    });
    
    if (loadedCount === totalCards) {
      layoutMasonry();
    }
    
    function layoutMasonry() {
      const gap = 24; // 2rem gap in pixels
      const containerWidth = grid.offsetWidth;
      const columnCount = Math.max(1, Math.floor(containerWidth / 260)); // ~260px per column
      const totalGapWidth = (columnCount - 1) * gap; // total horizontal gap space
      const availableWidth = containerWidth - totalGapWidth;
      const columnWidth = availableWidth / columnCount;
      const columns = Array(columnCount).fill(0); // track height of each column
      
      let maxHeight = 0;
      cards.forEach(card => {
        // find shortest column
        let shortestCol = 0;
        for (let i = 1; i < columnCount; i++) {
          if (columns[i] < columns[shortestCol]) {
            shortestCol = i;
          }
        }
        
        // position card (accounting for gap between columns)
        const x = shortestCol * (columnWidth + gap);
        const y = columns[shortestCol];
        
        card.style.position = 'absolute';
        card.style.left = x + 'px';
        card.style.top = y + 'px';
        card.style.width = columnWidth + 'px';
        
        // update column height (accounting for gap between rows)
        const cardHeight = card.offsetHeight;
        columns[shortestCol] += cardHeight + gap;
        maxHeight = Math.max(maxHeight, columns[shortestCol]);
      });
      
      // set grid height to accommodate all cards
      grid.style.position = 'relative';
      grid.style.height = maxHeight + 'px';
    }
    
    // Re-layout on window resize
    window.addEventListener('resize', () => {
      layoutMasonry();
    });
  }
  
  initMasonry();
});
