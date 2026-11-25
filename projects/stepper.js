// Click-through process-flow viewer: draws a schematic cross-section (X-X') for each
// fabrication step from a list of layer operations. Not to scale: thin films are
// exaggerated so every layer is visible.
const MAT = {
  si:    { name: 'Silicon',            fill: '#5b6676' },
  pr:    { name: 'Photoresist (SPR-220)', fill: '#f0a35b' },
  prx:   { name: 'Exposed resist',     fill: '#f7d2a6' },
  ap:    { name: 'AP-8000 promoter',   fill: '#e58fd3' },
  al:    { name: 'Aluminum',           fill: '#cfd6df' },
  sin:   { name: 'Si₃N₄ (PECVD)', fill: '#3ee6c1' },
  psg:   { name: 'PSG (sacrificial)',  fill: '#ffb347' },
  poly:  { name: 'Poly-Si',            fill: '#8ea2c8' },
  ptfe:  { name: 'C₄F₈ anti-stiction', fill: '#7fd0ff' },
  pdms:  { name: 'PDMS',               fill: '#b8c4cf' },
};
const N = 400, X0 = 4, X1 = 96, TOP = 30, BOT = 44;
const xs = Array.from({ length: N + 1 }, (_, i) => X0 + (X1 - X0) * i / N);
const inR = (x, rs) => rs.some(([a, b]) => x >= a && x <= b);

function build(ops) {
  let surf = xs.map(() => TOP), sub = xs.map(() => TOP);
  const polys = [];
  for (const op of ops) {
    if (op.etch) {
      sub = sub.map((y, i) => (inR(xs[i], op.etch) ? y + op.d : y));
      surf = surf.map((y, i) => (inR(xs[i], op.etch) ? Math.max(y, sub[i]) : y));
      continue;
    }
    const rs = op.at || [[X0, X1]];
    const old = surf.slice();
    if (op.fill !== undefined) surf = surf.map((y, i) => (inR(xs[i], rs) ? Math.min(y, op.fill) : y));
    else surf = surf.map((y, i) => (inR(xs[i], rs) ? y - op.t : y));
    for (const [a, b] of rs) {
      const idx = xs.map((x, i) => i).filter((i) => xs[i] >= a && xs[i] <= b);
      if (!idx.length) continue;
      const top = idx.map((i) => [xs[i], surf[i]]), bot = idx.map((i) => [xs[i], old[i]]).reverse();
      if (!op.hide) polys.push({ m: op.m, pts: top.concat(bot) });
    }
  }
  const s = xs.map((x, i) => [x, sub[i]]).concat([[X1, BOT], [X0, BOT]]);
  return [{ m: 'si', pts: s }, ...polys];
}

const svgNS = 'http://www.w3.org/2000/svg';
function draw(svg, stage) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const g = document.createElementNS(svgNS, 'g');
  if (stage.flip) g.setAttribute('transform', `translate(0 ${TOP * 2 - 14}) scale(1 -1)`);
  const polys = build(stage.ops).filter((p) => !stage.only || stage.only.includes(p.m));
  for (const p of polys) {
    const el = document.createElementNS(svgNS, 'polygon');
    el.setAttribute('points', p.pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '));
    el.setAttribute('fill', MAT[p.m].fill);
    el.setAttribute('stroke', 'rgba(0,0,0,.35)'); el.setAttribute('stroke-width', '0.12');
    g.appendChild(el);
  }
  for (const [x, y, t] of stage.notes || []) {
    const tx = document.createElementNS(svgNS, 'text');
    tx.setAttribute('x', x); tx.setAttribute('y', y); tx.textContent = t;
    tx.setAttribute('class', 'note'); svg.appendChild(tx);
  }
  svg.insertBefore(g, svg.firstChild);
  return [...new Set(polys.map((p) => p.m))];
}

export function mountStepper(root, stages) {
  const svg = root.querySelector('svg'), num = root.querySelector('.num'), title = root.querySelector('.st-title');
  const detail = root.querySelector('.st-detail'), why = root.querySelector('.st-why'), legend = root.querySelector('.legend');
  const dots = root.querySelector('.dots');
  stages.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Step ${i + 1}`); b.onclick = () => show(i); dots.appendChild(b); });
  let cur = 0;
  function show(i) {
    cur = (i + stages.length) % stages.length; const s = stages[cur];
    const mats = draw(svg, s);
    num.textContent = `${cur + 1} / ${stages.length}`; title.textContent = s.title; detail.textContent = s.detail;
    why.textContent = s.why || ''; why.style.display = s.why ? '' : 'none';
    legend.innerHTML = mats.map((m) => `<span><i style="background:${MAT[m].fill}"></i>${MAT[m].name}</span>`).join('');
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === cur));
  }
  root.querySelector('.prev').onclick = () => show(cur - 1);
  root.querySelector('.next').onclick = () => show(cur + 1);
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  show(0);
}
