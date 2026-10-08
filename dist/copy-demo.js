// Illustrative local state only. No real filesystem or transfer APIs.
export function initCopyDemo({ dialog, motionPreference, pauseCheck, onCompared, onReset }) {
  const $ = selector => document.querySelector(selector);
  const choices = [...document.querySelectorAll('[name="copy-file"]')];
  const all = $('#select-all-copy'); const destination = $('#copy-destination');
  const files = [
    { name: 'IMG_1048.jpg', size: 8.2, status: 'pending', selected: true, included: false },
    { name: 'IMG_1049.jpg', size: 6.4, status: 'pending', selected: true, included: false },
  ];
  const state = { phase: 'selection', stage: 'copy', queue: [], step: 0, compared: 0, timer: null, destination: 'external', enabled: false, retry: false };
  const announce = text => { $('#copy-announcement').textContent = text; };
  const stop = () => { clearInterval(state.timer); state.timer = null; };
  const selected = () => files.filter(file => file.selected && file.status !== 'confirmed');
  const confirmed = () => files.filter(file => file.status === 'confirmed');
  const format = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  function renderSelection() {
    choices.forEach((choice, index) => {
      choice.disabled = files[index].status === 'confirmed';
      choice.closest('label').hidden = choice.disabled;
      files[index].selected = !choice.disabled && choice.checked;
    });
    const available = choices.filter(choice => !choice.disabled);
    all.checked = available.length > 0 && available.every(choice => choice.checked);
    all.indeterminate = available.some(choice => choice.checked) && !all.checked;
    const count = selected().length;
    $('#review-copy').textContent = `Revisar ${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
    $('#review-copy').disabled = count === 0 || !destination.value;
    $('#same-volume-warning').hidden = destination.value !== 'same';
  }
  choices.forEach(choice => choice.addEventListener('change', renderSelection));
  all.addEventListener('change', () => { choices.filter(choice => !choice.disabled).forEach(choice => { choice.checked = all.checked; }); renderSelection(); });
  destination.addEventListener('change', renderSelection);

  function renderOperation() {
    const labels = { pending: 'Pendente', copying: 'Copiando…', verifying: 'Conferindo conteúdo…', confirmed: 'Copiado e confirmado' };
    $('#copy-results').innerHTML = files.filter(file => file.included).map(file => `<li><svg class="icon" aria-hidden="true"><use href="#i-${file.status === 'confirmed' ? 'check' : 'file'}"/></svg><span>${file.name}</span><span class="${file.status === 'confirmed' ? 'confirmed' : file.status === 'pending' ? 'pending' : 'working'}">${labels[file.status]}</span>${file.status === 'confirmed' ? `<small>${file.destination}/Fotos da viagem/Praia/${file.copyName || file.name}</small>` : ''}</li>`).join('');
    const copying = state.queue.length ? state.step / (state.queue.length * 8) : 1;
    const percent = Math.round(copying * 70 + state.compared / 50 * 30);
    $('#copy-progress').setAttribute('aria-valuenow', String(percent));
    $('#copy-progress>span').style.width = `${percent}%`; $('#copy-progress-text').textContent = `${percent}%`;
    $('#copy-recomparison').hidden = state.stage !== 'compare';
    $('#copy-recomparison').textContent = `${state.compared} de 50 arquivos conferidos na nova comparação, incluindo o destino das cópias.`;
  }
  function operationButtons(running) {
    for (const id of ['pause-copy', 'cancel-copy', 'skip-copy']) $(`#${id}`).hidden = !running;
    $('#reset-copy').hidden = running;
    const remaining = files.filter(file => file.status !== 'confirmed');
    $('#retry-copy').hidden = running || (state.phase === 'done' && remaining.length === 0);
    $('#retry-copy').textContent = state.phase === 'done' ? 'Copiar itens restantes…' : remaining.some(file => file.included) ? 'Tentar pendentes novamente' : 'Conferir conjunto novamente';
  }
  function settleFocus() {
    if (['pause-copy', 'cancel-copy', 'skip-copy', 'confirm-copy'].includes(document.activeElement?.id)) ($('#retry-copy').hidden ? $('#reset-copy') : $('#retry-copy')).focus({ preventScroll: true });
  }
  function finishComparison() {
    stop(); state.phase = 'done'; state.compared = 50; state.stage = 'compare';
    renderOperation(); operationButtons(false); settleFocus();
    const total = 48 + confirmed().length;
    $('#copy-summary').textContent = `${total} de 50 arquivos têm cópia confirmada.`;
    $('#copy-operation-title').textContent = 'Nova comparação completa concluída';
    $('#copy-phase').textContent = 'Conteúdo conferido. Novo destino incluído.';
    onCompared(confirmed().map(file => ({ name: file.name, destination: file.destination, copyName: file.copyName })));
    announce(`${total} de 50 arquivos têm cópia confirmada. Nova leitura do conjunto completo concluída, incluindo o destino das novas cópias.`);
  }
  function skip() {
    state.queue.forEach(file => { file.status = 'confirmed'; file.destination = state.destination === 'external' ? 'SSD das cópias' : 'Pasta de arquivos'; file.copyName = file.name === 'IMG_1048.jpg' ? 'IMG_1048 (1).jpg' : file.name; });
    state.step = state.queue.length * 8; finishComparison();
  }
  function tick() {
    if (state.stage === 'compare') {
      state.compared = Math.min(50, state.compared + 5);
      $('#copy-phase').textContent = 'Nova comparação do conjunto completo…'; renderOperation();
      if (state.compared === 50) finishComparison();
      return;
    }
    const current = state.queue[Math.floor(state.step / 8)];
    const stage = state.step % 8;
    current.status = stage < 4 ? 'copying' : 'verifying';
    $('#copy-phase').textContent = `${stage < 4 ? 'Copiando' : 'Conferindo o conteúdo de'} ${current.name}`;
    if (stage === 7) {
      current.status = 'confirmed'; current.destination = state.destination === 'external' ? 'SSD das cópias' : 'Pasta de arquivos';
      current.copyName = current.name === 'IMG_1048.jpg' ? 'IMG_1048 (1).jpg' : current.name;
    }
    state.step += 1;
    if (state.step === state.queue.length * 8) { state.stage = 'compare'; $('#copy-operation-title').textContent = '4. Conferindo o conjunto novamente'; }
    renderOperation();
  }
  function run({ comparisonOnly = false } = {}) {
    stop(); state.queue = comparisonOnly ? [] : selected();
    if (!comparisonOnly && !state.queue.length) return;
    state.queue.forEach(file => { file.included = true; });
    state.phase = 'running'; state.stage = comparisonOnly ? 'compare' : 'copy'; state.step = 0; state.compared = 0;
    $('#copy-selection').hidden = true; $('#copy-review').hidden = true; $('#copy-operation').hidden = false;
    $('#copy-operation-title').textContent = comparisonOnly ? '4. Conferindo o conjunto novamente' : '3. Copiando e conferindo';
    $('#pause-copy').textContent = 'Pausar'; $('#copy-phase').textContent = comparisonOnly ? 'Nova comparação do conjunto completo…' : 'Preparando cópia…';
    operationButtons(true); renderOperation(); announce('Demonstração iniciada. Cópias serão confirmadas pelo conteúdo; depois o conjunto completo será comparado novamente.');
    if (motionPreference.matches) { skip(); return; }
    $('#pause-copy').focus({ preventScroll: true }); state.timer = setInterval(tick, 180);
  }
  function pause() {
    if (state.phase !== 'running') return;
    stop(); state.phase = 'paused'; $('#pause-copy').textContent = 'Continuar'; $('#copy-phase').textContent = 'Operação pausada.'; announce('Operação ilustrativa pausada.');
  }
  $('#pause-copy').addEventListener('click', () => {
    if (state.phase === 'running') pause();
    else if (state.phase === 'paused') { state.phase = 'running'; $('#pause-copy').textContent = 'Pausar'; state.timer = setInterval(tick, 180); announce('Operação retomada.'); }
  });
  $('#cancel-copy').addEventListener('click', () => {
    stop(); state.phase = 'cancelled'; files.forEach(file => { if (file.status !== 'confirmed') file.status = 'pending'; });
    renderOperation(); operationButtons(false); settleFocus();
    $('#copy-operation-title').textContent = 'Operação cancelada';
    $('#copy-phase').textContent = state.stage === 'compare' ? 'Cópias confirmadas conservadas. Nova comparação não concluída.' : 'Cópias confirmadas conservadas. Demais itens pendentes.';
    announce('Operação cancelada. Originais intactos e cópias já confirmadas conservadas.');
  });
  function review() {
    if (!selected().length || !destination.value) return;
    state.phase = 'review'; state.destination = destination.value;
    $('#copy-selection').hidden = true; $('#copy-review').hidden = false;
    const count = selected().length;
    $('#review-count').textContent = `${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
    $('#review-size').textContent = `${format(selected().reduce((sum, file) => sum + file.size, 0))} MB`;
    $('#review-space').textContent = state.destination === 'external' ? '120 GB' : '18 GB';
    $('#review-destination').textContent = state.destination === 'external' ? 'SSD das cópias — outro dispositivo' : 'Pasta de arquivos — mesmo volume';
    $('#review-volume-warning').hidden = state.destination !== 'same'; $('#confirm-copy').focus({ preventScroll: true });
    announce(`Revise ${count} arquivos, ${$('#review-size').textContent}, espaço disponível ${$('#review-space').textContent}.`);
  }
  $('#review-copy').addEventListener('click', review);
  $('#back-copy').addEventListener('click', () => { state.phase = 'selection'; $('#copy-review').hidden = true; $('#copy-selection').hidden = false; $('#review-copy').focus({ preventScroll: true }); });
  $('#confirm-copy').addEventListener('click', () => run()); $('#skip-copy').addEventListener('click', skip);
  function selectRemaining(pending) {
    state.retry = true; state.phase = 'selection'; destination.value = '';
    choices.forEach((choice, index) => { choice.checked = pending.includes(files[index]); });
    $('#copy-operation').hidden = true; $('#copy-selection').hidden = false; renderSelection(); destination.focus({ preventScroll: true });
    announce('Escolha novamente o destino para escrever os itens pendentes. As cópias confirmadas serão preservadas.');
  }
  $('#retry-copy').addEventListener('click', () => {
    const pending = files.filter(file => file.status !== 'confirmed' && (state.phase === 'done' || file.included));
    if (!pending.length) { run({ comparisonOnly: true }); return; }
    selectRemaining(pending);
  });
  function reset() {
    stop(); Object.assign(state, { phase: 'selection', stage: 'copy', step: 0, compared: 0, queue: [], retry: false });
    files.forEach(file => Object.assign(file, { status: 'pending', selected: true, included: false, destination: null, copyName: null }));
    choices.forEach(choice => { choice.checked = true; choice.disabled = false; }); destination.value = 'external';
    $('#copy-selection').hidden = false; $('#copy-review').hidden = true; $('#copy-operation').hidden = true;
    $('#copy-summary').textContent = '48 de 50 arquivos têm cópia confirmada.'; renderSelection();
  }
  $('#reset-copy').addEventListener('click', () => { reset(); onReset(); $('#review-copy').focus({ preventScroll: true }); });
  motionPreference.addEventListener('change', event => { if (event.matches && ['running', 'paused'].includes(state.phase)) skip(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  function selectMode(mode) {
    if (mode === 'copy' && !state.enabled) return;
    if (mode === 'copy') pauseCheck(); else pause();
    document.querySelectorAll('[data-demo-mode]').forEach(tab => {
      const active = tab.dataset.demoMode === mode;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $(`#panel-${tab.dataset.demoMode}`).hidden = !active;
    });
  }
  function enable(enabled) { state.enabled = enabled; $('#tab-copy').disabled = !enabled; }
  const tabs = [...document.querySelectorAll('[data-demo-mode]')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => selectMode(tab.dataset.demoMode));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const available = tabs.filter(item => !item.disabled);
      const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1) : available[(available.indexOf(tab) + 1) % available.length];
      selectMode(next.dataset.demoMode); next.focus();
    });
  });
  $('[data-open-copy]').addEventListener('click', () => {
    selectMode('copy');
    const remaining = files.filter(file => file.status !== 'confirmed');
    if (state.phase === 'done' && remaining.length) selectRemaining(remaining);
    else if (state.phase === 'selection') $('#review-copy').focus({ preventScroll: true });
    else if (!$('#retry-copy').hidden) $('#retry-copy').focus({ preventScroll: true });
  });
  reset(); enable(false);
  return { selectMode, pause, reset: () => { reset(); enable(false); }, enable };
}
