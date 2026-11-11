/* Visual example only: no API requests or credentials are sent. */
(() => {
  const monitor = document.querySelector('[data-code-demo]');
  if (!monitor) return;
  const pre = monitor.querySelector('pre');
  const button = monitor.querySelector('[data-code-toggle]');
  const label = monitor.querySelector('[data-code-label]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, visible = true, index = 0, timer;
  // Reveal existing highlighted text nodes, preserving the source markup.
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push({node:walker.currentNode,text:walker.currentNode.textContent});
  const length = nodes.reduce((total,item) => total + item.text.length, 0);
  pre.setAttribute('aria-label', 'CashPay API code example');
  pre.setAttribute('aria-live', 'off');
  function render(count) {
    let remaining = count;
    nodes.forEach(item => {item.node.textContent=item.text.slice(0,Math.max(0,remaining));remaining-=item.text.length;});
  }
  function labels() {
    const en = document.documentElement.lang.startsWith('en');
    label.textContent = en ? 'Code example · animation' : 'Exemple de code · animation';
    button.querySelector('span').textContent = paused ? (en?'Play':'Lire') : 'Pause';
    button.querySelector('i').className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
    button.setAttribute('aria-pressed', String(!paused));
  }
  function schedule() {
    clearTimeout(timer);
    if(paused || !visible || document.hidden) return;
    timer=setTimeout(() => {
      index=index>=length ? 0 : Math.min(length,index+3);
      render(index);
      schedule();
    },index>=length ? 4500 : 24);
  }
  button.addEventListener('click',()=>{paused=!paused;labels();schedule();});
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('langchange',labels);
  reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused){index=length;render(length);}labels();schedule();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();}).observe(monitor);
  if(reduced.matches) index=length;
  render(index);labels();schedule();
})();
