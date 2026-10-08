import { product } from './config.js';
import { loadReleaseMetadata, loadReleaseDownloads } from './release.js?v=downloads-total';
import { initCopyDemo } from './copy-demo.js';

const $ = selector => document.querySelector(selector);
void loadReleaseMetadata();
void loadReleaseDownloads();

// A light deterrent, not source protection: browser menus can still open DevTools.
console.log('%cSai daqui, ô curioso! Sai, ô metido a hacker. 😄', 'background: #1559C7; color: #ECE9D8; padding: 8px 12px; font: bold 14px Tahoma, sans-serif;');
const isEditable = target => target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
let pointerContextMenu = false;
document.addEventListener('pointerdown', event => {
  pointerContextMenu = event.button === 2 || (event.button === 0 && event.ctrlKey);
}, { capture: true });
document.addEventListener('keydown', event => {
  pointerContextMenu = false;
  if (isEditable(event.target)) return;
  const key = event.key.toLowerCase();
  const inspectShortcut = ['i', 'j', 'c', 'k'].includes(key) && ((event.ctrlKey && event.shiftKey) || (event.metaKey && event.altKey));
  const sourceShortcut = key === 'u' && ((event.ctrlKey && !event.shiftKey && !event.altKey) || (event.metaKey && event.altKey));
  if (key === 'f12' || inspectShortcut || sourceShortcut) event.preventDefault();
}, { capture: true });
document.addEventListener('contextmenu', event => {
  const fromPointer = pointerContextMenu;
  pointerContextMenu = false;
  if (!fromPointer || isEditable(event.target) || window.getSelection()?.toString()) return;
  if (event.target instanceof Element && event.target.closest('a, button')) return;
  event.preventDefault();
});

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mobileNav.hidden = !open;
});
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a')) { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); }
});
function showPrice(amount, currency = 'BRL') {
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  document.querySelectorAll('[data-price]').forEach(el => { el.textContent = price; });
  $('[data-faq-subscription]').textContent = `${price} por ${product.price.interval} é o plano apresentado na área de licença do aplicativo. O pagamento e a ativação paga estão em preparação. A contratação fica dentro do app; o site não recebe pagamentos.`;
}
showPrice(product.price.amount, product.price.currency);
async function refreshPublicPrice() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`${product.licensingApiUrl}/v1/plans/current`, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) return;
    const plan = await response.json();
    if (plan.currency !== 'BRL' || !Number.isSafeInteger(plan.amountCents) || plan.amountCents < 100) return;
    showPrice(plan.amountCents / 100, plan.currency);
  } catch {
    // Keep the known plan value when the license service is temporarily unavailable.
  } finally {
    clearTimeout(timeout);
  }
}
void refreshPublicPrice();
function safeHttps(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } }
for (const [key, label] of Object.entries({ product: 'Informações do produto', privacy: 'Política de privacidade', terms: 'Termos de uso' })) {
  const href = safeHttps(product.links[key]);
  if (href) { const link = document.createElement('a'); link.href = href; link.textContent = label; $('.footer-links').append(link); }
}
if (product.contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(product.contact)) {
  const link = document.createElement('a'); link.href = `mailto:${product.contact}`; link.textContent = 'Contato'; $('.footer-links').append(link);
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const files = Array.from({ length: 50 }, (_, index) => ({
  name: `IMG_${1000 + index}.jpg`, baseFound: index < 48, found: index < 48,
  destination: 'Backup no SSD', copyName: index === 0 ? 'praia.jpg' : index === 3 ? 'por-do-sol.jpg' : null,
}));
const state = { phase: 'idle', processed: 0, tick: 0, filter: 'all', search: '', timer: null, source: false, destination: false };
const startButton = $('#start-demo');
const pauseButton = $('#pause-demo');
const finishButton = $('#finish-demo');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const announce = text => { $('#demo-announcement').textContent = text; };
const checkedFiles = () => files.slice(0, state.processed);
const foundCount = () => checkedFiles().filter(file => file.found).length;

function renderFiles() {
  const complete = state.phase === 'done';
  const visible = files.filter(file => (state.filter === 'all' || (state.filter === 'found' ? file.found : !file.found)) && file.name.toLowerCase().includes(state.search));
  $('#demo-files').innerHTML = visible.map(file => {
    const checked = complete || files.indexOf(file) < state.processed;
    const status = checked ? (file.found ? 'found' : 'missing') : 'awaiting';
    const label = checked ? (file.found ? 'Cópia encontrada' : 'Sem cópia encontrada') : 'Aguardando conferência';
    const icon = checked ? `<svg class="icon" aria-hidden="true"><use href="#i-${file.found ? 'check' : 'warning'}"/></svg>` : '';
    return `<tr class="${status === 'missing' ? 'is-missing' : ''}"><td><svg class="icon" aria-hidden="true"><use href="#i-file"/></svg>${file.name}${checked && file.copyName ? `<small>Cópia: ${file.copyName}</small>` : ''}</td><td>${checked ? (file.found ? file.destination : 'Nenhum dos destinos') : '—'}</td><td><span class="file-status ${status}">${icon}${label}</span></td></tr>`;
  }).join('') || '<tr><td colspan="3" class="no-results">Nenhum arquivo corresponde à busca e ao filtro.</td></tr>';
  $('#visible-count').textContent = `${visible.length} arquivos`;
  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    button.setAttribute('aria-pressed', String(filter === state.filter));
    button.disabled = filter !== 'all' && !complete;
    button.querySelector('span').textContent = filter === 'all' ? '50' : filter === 'found' ? String(foundCount()) : String(state.processed - foundCount());
  });
}
function updateProgress() {
  $('#demo-progress').setAttribute('aria-valuenow', String(state.processed));
  $('#demo-progress>span').style.width = `${state.processed * 2}%`;
  $('#progress-count').textContent = `${state.processed} de 50`;
  $('#demo-source').classList.toggle('is-active', state.tick < 5 && state.phase === 'running');
  $('#demo-destinations').classList.toggle('is-active', state.tick >= 5 && state.tick < 10 && state.phase === 'running');
  const label = state.tick < 5 ? 'Conferindo a origem…' : state.tick < 10 ? 'Consultando o destino…' : 'Comparando o conteúdo dos arquivos…';
  $('#demo-phase').textContent = label; $('#progress-label').textContent = label;
}
function clearTimer() { clearInterval(state.timer); state.timer = null; }
function showResult() {
  const found = files.filter(file => file.found).length;
  const missing = 50 - found;
  $('#demo-result').hidden = false;
  $('#demo-result h3').textContent = `${found} de 50 arquivos têm cópia confirmada.`;
  $('#demo-result p').textContent = missing ? `${missing} ${missing === 1 ? 'arquivo sem cópia encontrada' : 'arquivos sem cópia encontrada'} nos destinos escolhidos.` : 'Nova comparação completa, incluindo o destino das novas cópias.';
  $('.result-count').innerHTML = `${found}<span>/50</span>`;
  $('.copy-next-step').hidden = missing === 0;
  copyDemo.enable(true);
}
function finish() {
  clearTimer(); state.phase = 'done'; state.processed = 50; state.tick = 60;
  updateProgress(); renderFiles(); showResult();
  startButton.disabled = false;
  startButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-repeat"/></svg>Repetir demonstração';
  if (document.activeElement === pauseButton || document.activeElement === finishButton) startButton.focus({ preventScroll: true });
  pauseButton.hidden = true; finishButton.hidden = true;
  $('#demo-phase').textContent = 'Conferência concluída.'; $('#progress-label').textContent = 'Conteúdo conferido';
  $('#demo-status').textContent = '50 arquivos verificados · 2 precisam de atenção';
  announce('48 de 50 arquivos têm cópia confirmada. IMG_1048.jpg e IMG_1049.jpg estão sem cópia encontrada. Você pode selecionar os faltantes para copiar.');
}
function tick() {
  state.tick += 1; state.processed = Math.max(0, Math.min(50, state.tick - 10));
  if (state.processed === 50) { finish(); return; }
  updateProgress(); renderFiles();
}
function start() {
  if (!state.source || !state.destination) return;
  clearTimer(); copyDemo.reset();
  files.forEach(file => { file.found = file.baseFound; file.destination = 'Backup no SSD'; if (!file.baseFound) file.copyName = null; });
  Object.assign(state, { phase: 'running', processed: 0, tick: 0, filter: 'all', search: '' });
  $('#demo-search').value = ''; $('#additional-destination').hidden = true; $('.file-table-scroll').scrollTop = 0;
  $('#demo-result').hidden = true; $('.copy-next-step').hidden = true; $('.demo-progress-wrap').hidden = false;
  startButton.disabled = true;
  startButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>Conferindo cópias…';
  pauseButton.hidden = false; pauseButton.textContent = 'Pausar'; finishButton.hidden = false;
  $('#demo-status').textContent = 'Conferência de conteúdo em andamento';
  updateProgress(); renderFiles();
  announce('Conferindo 50 arquivos fictícios. Você pode pausar ou ver o resultado agora.');
  if (motionPreference.matches) { finish(); return; }
  pauseButton.focus({ preventScroll: true }); state.timer = setInterval(tick, 120);
}
for (const [id, field, label] of [['choose-source', 'source', 'Origem escolhida'], ['choose-destination', 'destination', 'Destino escolhido']]) {
  $(`#${id}`).addEventListener('click', event => {
    state[field] = true; event.currentTarget.setAttribute('aria-pressed', 'true'); event.currentTarget.textContent = label;
    startButton.disabled = !state.source || !state.destination;
    $('#demo-phase').textContent = startButton.disabled ? 'Escolha também o outro item fictício.' : 'Tudo pronto para conferir.';
  });
}
startButton.addEventListener('click', start); finishButton.addEventListener('click', finish);
pauseButton.addEventListener('click', () => {
  if (state.phase === 'running') {
    clearTimer(); state.phase = 'paused'; pauseButton.textContent = 'Continuar';
    $('#demo-phase').textContent = 'Demonstração pausada.'; $('#progress-label').textContent = 'Conferência pausada';
    $('#demo-status').textContent = 'Pausada · nada foi alterado'; announce('Demonstração pausada.');
  } else if (state.phase === 'paused') {
    state.phase = 'running'; pauseButton.textContent = 'Pausar'; $('#demo-status').textContent = 'Conferência de conteúdo em andamento';
    updateProgress(); state.timer = setInterval(tick, 120); announce('Demonstração retomada.');
  }
});
filterButtons.forEach(button => button.addEventListener('click', () => {
  state.filter = button.dataset.filter; renderFiles(); $('.file-table-scroll').scrollTop = 0;
  announce(`Filtro ${button.textContent.trim()}. ${$('#visible-count').textContent} na lista.`);
}));
$('#demo-search').addEventListener('input', event => { state.search = event.target.value.trim().toLowerCase(); renderFiles(); });
motionPreference.addEventListener('change', event => { if (event.matches && ['running', 'paused'].includes(state.phase)) finish(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase === 'running') pauseButton.click(); });

const demoDialog = $('#demo-dialog');
let demoOpener = null;
const copyDemo = initCopyDemo({ dialog: demoDialog, motionPreference,
  pauseCheck: () => { if (state.phase === 'running') pauseButton.click(); },
  onReset: () => {
    files.forEach(file => { file.found = file.baseFound; file.destination = 'Backup no SSD'; if (!file.baseFound) file.copyName = null; });
    state.phase = 'done'; state.processed = 50; state.filter = 'all'; state.search = '';
    $('#demo-search').value = ''; $('#additional-destination').hidden = true;
    renderFiles(); showResult(); $('#demo-status').textContent = 'Conferência inicial · 2 arquivos sem cópia';
  },
  onCompared: confirmedFiles => {
    confirmedFiles.forEach(copied => {
      const file = files.find(item => item.name === copied.name);
      if (file) { file.found = true; file.destination = copied.destination; file.copyName = copied.copyName; }
    });
    state.phase = 'done'; state.processed = 50;
    state.filter = 'all'; state.search = ''; $('#demo-search').value = '';
    $('#additional-destination').textContent = [...new Set(confirmedFiles.map(file => file.destination))].join(' + ');
    $('#additional-destination').hidden = false;
    renderFiles(); showResult();
    $('#demo-status').textContent = 'Nova comparação concluída · novo destino incluído';
    $('#demo-phase').textContent = 'Comparação atualizada depois da cópia.';
  },
});
renderFiles();
for (const link of document.querySelectorAll('[data-open-demo]')) {
  link.addEventListener('click', event => {
    demoOpener = link.closest('#mobile-nav') ? menuToggle : link;
    event.preventDefault(); demoDialog.showModal(); copyDemo.selectMode('check'); document.body.classList.add('dialog-open');
    (state.source && state.destination ? startButton : $('#choose-source')).focus({ preventScroll: true });
  });
}
$('.dialog-close').addEventListener('click', () => demoDialog.close());
demoDialog.addEventListener('click', event => { if (event.target === demoDialog) demoDialog.close(); });
demoDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (state.phase === 'running') pauseButton.click();
  copyDemo.pause();
  const opener = demoOpener?.getClientRects().length ? demoOpener : (menuToggle.getClientRects().length ? menuToggle : $('.hero-actions [data-open-demo]'));
  opener?.focus({ preventScroll: true });
});
if (location.hash === '#demonstracao') { demoDialog.showModal(); document.body.classList.add('dialog-open'); }

// Preserve native disclosure behavior and animate briefly in both directions.
document.querySelectorAll('.faq-list details, .feature-detail, .compact-privacy details, .upcoming-details').forEach(details => {
  let animation; let targetOpen = details.open;
  details.querySelector('summary').addEventListener('click', event => {
    if (motionPreference.matches || !details.animate) return;
    event.preventDefault(); const height = details.getBoundingClientRect().height; animation?.cancel(); targetOpen = !targetOpen; details.open = true;
    const endHeight = targetOpen ? details.scrollHeight : details.querySelector('summary').getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    animation = details.animate({ height: [`${height}px`, `${endHeight}px`] }, { duration: 180, easing: 'ease-out' });
    animation.onfinish = () => { details.open = targetOpen; details.style.overflow = ''; animation = null; };
  });
  details.addEventListener('toggle', () => { if (!animation) targetOpen = details.open; });
});
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
