document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav-main');
  const toggle = document.querySelector('.nav-toggle');
  const list = document.getElementById('primary-navigation');
  if (!nav || !toggle || !list) return;

  function setOpen(open){
    if(open){
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded','true');
      list.setAttribute('data-open','true');
      // move focus into first link
      const first = list.querySelector('a');
      if(first) first.focus();
    } else {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      list.setAttribute('data-open','false');
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    setOpen(!isOpen);
  });

  // close on escape
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
  });

  // close when clicking outside
  document.addEventListener('click', (e) => {
    if(!nav.classList.contains('open')) return;
    if(nav.contains(e.target)) return; // click inside
    setOpen(false);
  });

  // ensure menu state updates on resize (if > breakpoint, close)
  function checkResize(){
    if(window.matchMedia('(min-width: 721px)').matches){
      setOpen(false);
    }
  }
  window.addEventListener('resize', checkResize);
  checkResize();
});