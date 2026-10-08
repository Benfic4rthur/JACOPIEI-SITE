import { product } from './config.js';
import { initCopyDemo } from './copy-demo.js';
document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${product.version}`; });
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mobileNav.hidden = !open;
});
mobileNav.addEventListener('click', e => {
  if (e.target.closest('a')) { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); }
});

// Only a real HTTPS installer URL AND public availability activate downloads.
function safeHttps(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
const download = product.publicAvailable && safeHttps(product.downloadUrl);
const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.price.currency }).format(product.price.amount);
document.querySelectorAll('[data-price]').forEach(el => { el.textContent = price; });
if (download) {
  document.querySelectorAll('[data-primary-cta]').forEach(el => { el.textContent = 'Baixar para macOS'; el.href = download; });
  document.querySelectorAll('[data-launch-status]').forEach(el => { el.textContent = 'Disponível para macOS'; });
}
const subscriptionNote = product.subscriptionAvailable
  ? 'Baixe o app e assine pelo próprio JáCopiei?'
  : 'A assinatura será realizada dentro do aplicativo quando disponível.';
document.querySelector('[data-subscription-note]').textContent = subscriptionNote;
document.querySelector('[data-price-note]').textContent = product.subscriptionAvailable ? 'Assinatura mensal pelo aplicativo.' : 'Preço previsto para o lançamento.';
document.querySelector('[data-faq-subscription]').textContent = `${subscriptionNote} ${product.subscriptionAvailable ? 'O valor é' : 'O preço previsto para o lançamento é'} ${price} por ${product.price.interval}. Este site não coleta pagamentos nem dados de cartão.`;
for (const [key, label] of Object.entries({ product: 'Informações do produto', privacy: 'Política de privacidade', terms: 'Termos de uso' })) {
  const href = safeHttps(product.links[key]);
  if (href) { const link = document.createElement('a'); link.href = href; link.textContent = label; document.querySelector('.footer-links').append(link); }
}
if (product.contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(product.contact)) {
  const link = document.createElement('a'); link.href = `mailto:${product.contact}`; link.textContent = 'Contato'; document.querySelector('.footer-links').append(link);
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const files = Array.from({ length: 50 }, (_, index) => ({
  name: `IMG_${1000 + index}.jpg`,
  found: index < 48,
  destination: index % 2 === 0 ? 'Backup no SSD' : 'Pasta de arquivos',
  copyName: index === 0 ? 'praia.jpg' : index === 3 ? 'por-do-sol.jpg' : null,
}));
const state = { phase: 'idle', processed: 0, tick: 0, filter: 'all', timer: null };
const $ = selector => document.querySelector(selector);
const startButton = $('#start-demo');
const pauseButton = $('#pause-demo');
const finishButton = $('#finish-demo');
const list = $('#demo-files');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const announce = text => { $('#demo-announcement').textContent = text; };

function renderFiles() {
  const complete = state.phase === 'done';
  const visible = files.filter(file => state.filter === 'all' || (state.filter === 'found' ? file.found : !file.found));
  list.innerHTML = visible.map(file => {
    const checked = complete || files.indexOf(file) < state.processed;
    const status = checked ? (file.found ? 'found' : 'missing') : 'awaiting';
    const label = checked ? (file.found ? 'Cópia encontrada' : 'Sem cópia encontrada') : 'Aguardando conferência';
    const icon = checked ? `<svg class="icon" aria-hidden="true"><use href="#i-${file.found ? 'check' : 'warning'}"/></svg>` : '';
    return `<tr class="${status === 'missing' ? 'is-missing' : ''}"><td><svg class="icon" aria-hidden="true"><use href="#i-file"/></svg>${file.name}${checked && file.copyName ? `<small>Cópia: ${file.copyName}</small>` : ''}</td><td>${checked ? (file.found ? file.destination : 'Nenhum dos destinos') : '—'}</td><td><span class="file-status ${status}">${icon}${label}</span></td></tr>`;
  }).join('');
  $('#visible-count').textContent = `${visible.length} arquivos`;
  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    button.setAttribute('aria-pressed', String(filter === state.filter));
    button.disabled = filter !== 'all' && !complete;
    button.querySelector('span').textContent = filter === 'all' ? '50' : filter === 'found' ? String(Math.min(state.processed, 48)) : String(Math.max(state.processed - 48, 0));
  });
}
function updateProgress() {
  $('#demo-progress').setAttribute('aria-valuenow', String(state.processed));
  $('#demo-progress>span').style.width = `${state.processed * 2}%`;
  $('#progress-count').textContent = `${state.processed} de 50`;
  $('#demo-source').classList.toggle('is-active', state.tick < 5 && state.phase === 'running');
  $('#demo-destinations').classList.toggle('is-active', state.tick >= 5 && state.tick < 10 && state.phase === 'running');
  const phaseLabel = state.tick < 5 ? 'Conferindo a origem…' : state.tick < 10 ? 'Consultando os destinos…' : 'Comparando o conteúdo dos arquivos…';
  $('#demo-phase').textContent = phaseLabel;
  $('#progress-label').textContent = phaseLabel;
}
function clearTimer() { window.clearInterval(state.timer); state.timer = null; }
function finish() {
  clearTimer();
  state.phase = 'done'; state.processed = 50; state.tick = 60;
  updateProgress(); renderFiles();
  startButton.disabled = false;
  startButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-repeat"/></svg>Repetir demonstração';
  if (document.activeElement === pauseButton || document.activeElement === finishButton) startButton.focus({ preventScroll: true });
  pauseButton.hidden = true; finishButton.hidden = true;
  $('#demo-result').hidden = false;
  $('#demo-phase').textContent = 'Conferência concluída.';
  $('#progress-label').textContent = 'Conteúdo conferido';
  $('#demo-status').textContent = '50 arquivos verificados · 2 precisam de atenção';
  announce('Conferência concluída. 48 de 50 arquivos têm cópia confirmada. IMG_1048.jpg e IMG_1049.jpg estão sem cópia encontrada. Os filtros estão disponíveis.');
}
function tick() {
  state.tick += 1;
  state.processed = Math.max(0, Math.min(50, state.tick - 10));
  if (state.processed === 50) { finish(); return; }
  updateProgress(); renderFiles();
}
function start() {
  clearTimer();
  Object.assign(state, { phase: 'running', processed: 0, tick: 0, filter: 'all' });
  $('.file-table-scroll').scrollTop = 0;
  $('#demo-result').hidden = true;
  $('.demo-progress-wrap').hidden = false;
  startButton.disabled = true;
  startButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>Conferindo cópias…';
  pauseButton.hidden = false; pauseButton.textContent = 'Pausar';
  finishButton.hidden = false;
  $('#demo-status').textContent = 'Conferência de conteúdo em andamento';
  updateProgress(); renderFiles();
  announce('Demonstração iniciada. Conferindo 50 arquivos fictícios. Você pode pausar ou ver o resultado agora.');
  if (motionPreference.matches) { finish(); return; }
  state.timer = window.setInterval(tick, 120);
}
startButton.addEventListener('click', start);
finishButton.addEventListener('click', finish);
pauseButton.addEventListener('click', () => {
  if (state.phase === 'running') {
    clearTimer(); state.phase = 'paused'; pauseButton.textContent = 'Continuar';
    $('#demo-phase').textContent = 'Demonstração pausada.';
    $('#progress-label').textContent = 'Conferência pausada';
    $('#demo-status').textContent = 'Pausada · nada foi alterado';
    announce('Demonstração pausada.');
  } else if (state.phase === 'paused') {
    state.phase = 'running'; pauseButton.textContent = 'Pausar';
    $('#demo-status').textContent = 'Conferência de conteúdo em andamento';
    updateProgress(); state.timer = window.setInterval(tick, 120);
    announce('Demonstração retomada.');
  }
});
filterButtons.forEach(button => button.addEventListener('click', () => {
  state.filter = button.dataset.filter; renderFiles(); $('.file-table-scroll').scrollTop = 0;
  const count = state.filter === 'all' ? 50 : state.filter === 'found' ? 48 : 2;
  announce(`Filtro ${button.textContent.trim()}. ${count} arquivos na lista.`);
}));
motionPreference.addEventListener('change', event => { if (event.matches && ['running', 'paused'].includes(state.phase)) finish(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase === 'running') pauseButton.click(); });
renderFiles();

// The full simulation is opened on demand, keeping the main page short.
const demoDialog = $('#demo-dialog');
const copyDemo = initCopyDemo({ dialog: demoDialog, motionPreference, pauseCheck: () => { if (state.phase === 'running') pauseButton.click(); } });
document.querySelectorAll('a[href="#demonstracao"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    demoDialog.showModal();
    copyDemo.selectMode('check');
    document.body.classList.add('dialog-open');
    startButton.focus({ preventScroll: true });
  });
});
$('.dialog-close').addEventListener('click', () => demoDialog.close());
demoDialog.addEventListener('click', event => { if (event.target === demoDialog) demoDialog.close(); });
demoDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (state.phase === 'running') pauseButton.click();
  copyDemo.pause();
});
if (location.hash === '#demonstracao') {
  demoDialog.showModal(); document.body.classList.add('dialog-open');
}

// Native details remain usable without JavaScript; animate both directions when allowed.
document.querySelectorAll('.faq-list details, .feature-detail, .compact-privacy details').forEach(details => {
  let animation;
  let targetOpen = details.open;
  details.querySelector('summary').addEventListener('click', event => {
    if (motionPreference.matches || !details.animate) return;
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    animation?.cancel();
    targetOpen = !targetOpen;
    details.open = true;
    const endHeight = targetOpen ? details.scrollHeight : details.querySelector('summary').getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    animation = details.animate({ height: [`${startHeight}px`, `${endHeight}px`] }, { duration: 180, easing: 'ease-out' });
    animation.onfinish = () => { details.open = targetOpen; details.style.overflow = ''; animation = null; };
  });
  details.addEventListener('toggle', () => { if (!animation) targetOpen = details.open; });
});
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
