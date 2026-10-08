// A browser-only simulation. No filesystem, upload, copy, or payment APIs are used.
export function initCopyDemo({ dialog, motionPreference, pauseCheck }) {
  const $ = selector => document.querySelector(selector);
  const choices = [...document.querySelectorAll('[name="copy-file"]')];
  const all = $('#select-all-copy');
  const destination = $('#copy-destination');
  const files = [
    { name: 'IMG_1048.jpg', size: 8.2, status: 'pending', selected: true },
    { name: 'IMG_1049.jpg', size: 6.4, status: 'pending', selected: true },
  ];
  const state = { phase: 'selection', queue: [], step: 0, timer: null, destination: 'external' };
  const announce = text => { $('#copy-announcement').textContent = text; };
  const stop = () => { clearInterval(state.timer); state.timer = null; };
  const confirmed = () => files.filter(file => file.status === 'confirmed').length;
  const selected = () => files.filter(file => file.selected);
  const format = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  function renderSelection() {
    choices.forEach((choice, index) => { files[index].selected = choice.checked; });
    all.checked = choices.every(choice => choice.checked);
    all.indeterminate = choices.some(choice => choice.checked) && !all.checked;
    const count = selected().length;
    $('#review-copy').textContent = `Revisar ${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
    $('#review-copy').disabled = count === 0;
    $('#same-volume-warning').hidden = destination.value !== 'same';
  }
  choices.forEach(choice => choice.addEventListener('change', renderSelection));
  all.addEventListener('change', () => { choices.forEach(choice => { choice.checked = all.checked; }); renderSelection(); });
  destination.addEventListener('change', renderSelection);

  function renderOperation() {
    const labels = { pending: 'Pendente', copying: 'Copiando…', verifying: 'Conferindo conteúdo…', confirmed: 'Copiado e confirmado' };
    $('#copy-results').innerHTML = selected().map(file => `<li><svg class="icon" aria-hidden="true"><use href="#i-${file.status === 'confirmed' ? 'check' : 'file'}"/></svg><span>${file.name}</span><span class="${file.status === 'confirmed' ? 'confirmed' : file.status === 'pending' ? 'pending' : 'working'}">${labels[file.status]}</span></li>`).join('');
    $('#copy-summary').textContent = `${48 + confirmed()} de 50 arquivos têm cópia confirmada.`;
    const percent = state.queue.length ? Math.round(state.step / (state.queue.length * 8) * 100) : 0;
    $('#copy-progress').setAttribute('aria-valuenow', String(percent));
    $('#copy-progress>span').style.width = `${percent}%`;
    $('#copy-progress-text').textContent = `${percent}%`;
  }
  function operationButtons(running) {
    for (const id of ['pause-copy', 'cancel-copy', 'skip-copy']) $(`#${id}`).hidden = !running;
    $('#reset-copy').hidden = running;
    $('#retry-copy').hidden = running || !selected().some(file => file.status !== 'confirmed');
  }
  function settleFocus() {
    if (['pause-copy', 'cancel-copy', 'skip-copy'].includes(document.activeElement?.id)) {
      ($('#retry-copy').hidden ? $('#reset-copy') : $('#retry-copy')).focus({ preventScroll: true });
    }
  }
  function complete() {
    stop(); state.phase = 'done';
    // Skipping the animation represents completing both copy AND content verification.
    state.queue.forEach(file => { file.status = 'confirmed'; });
    state.step = state.queue.length * 8;
    renderOperation(); operationButtons(false); settleFocus();
    $('#copy-operation-title').textContent = 'Conferência após a cópia concluída';
    $('#copy-phase').textContent = 'Conteúdo verificado. Comparação atualizada.';
    announce(`${48 + confirmed()} de 50 arquivos têm cópia confirmada. Conteúdo das novas cópias verificado. Comparação atualizada.`);
  }
  function tick() {
    const index = Math.floor(state.step / 8);
    const current = state.queue[index];
    if (!current) { complete(); return; }
    const stage = state.step % 8;
    current.status = stage < 4 ? 'copying' : 'verifying';
    $('#copy-phase').textContent = `${stage < 4 ? 'Copiando' : 'Conferindo o conteúdo de'} ${current.name}`;
    if (stage === 7) current.status = 'confirmed';
    state.step += 1;
    renderOperation();
    if (state.step === state.queue.length * 8) complete();
  }
  function run() {
    stop();
    state.queue = selected().filter(file => file.status !== 'confirmed');
    if (!state.queue.length) return;
    state.phase = 'running'; state.step = 0;
    $('#copy-selection').hidden = true; $('#copy-review').hidden = true; $('#copy-operation').hidden = false;
    $('#copy-operation-title').textContent = '3. Copiando e conferindo';
    $('#pause-copy').textContent = 'Pausar';
    $('#copy-phase').textContent = 'Preparando cópia…';
    operationButtons(true); renderOperation();
    announce('Cópia simulada iniciada. Cada arquivo será confirmado somente após a conferência do conteúdo.');
    if (motionPreference.matches) { complete(); return; }
    $('#pause-copy').focus({ preventScroll: true });
    state.timer = setInterval(tick, 240);
  }
  function pause() {
    if (state.phase !== 'running') return;
    stop(); state.phase = 'paused';
    $('#pause-copy').textContent = 'Continuar';
    $('#copy-phase').textContent = 'Operação pausada.';
    announce('Cópia e conferência simuladas pausadas.');
  }
  $('#pause-copy').addEventListener('click', () => {
    if (state.phase === 'running') pause();
    else if (state.phase === 'paused') {
      state.phase = 'running'; $('#pause-copy').textContent = 'Pausar';
      state.timer = setInterval(tick, 240); announce('Operação retomada.');
    }
  });
  $('#cancel-copy').addEventListener('click', () => {
    stop(); state.phase = 'cancelled';
    files.forEach(file => { if (file.status !== 'confirmed') file.status = 'pending'; });
    renderOperation(); operationButtons(false); settleFocus();
    $('#copy-operation-title').textContent = 'Operação cancelada';
    $('#copy-phase').textContent = 'Os itens sem confirmação continuam pendentes.';
    announce('Operação cancelada. Originais intactos. Você pode tentar os itens pendentes novamente.');
  });
  $('#review-copy').addEventListener('click', () => {
    if (!selected().length) return;
    state.phase = 'review'; state.destination = destination.value;
    $('#copy-selection').hidden = true; $('#copy-review').hidden = false;
    $('#review-count').textContent = `${selected().length} ${selected().length === 1 ? 'arquivo' : 'arquivos'}`;
    $('#review-size').textContent = `${format(selected().reduce((sum, file) => sum + file.size, 0))} MB`;
    $('#review-space').textContent = state.destination === 'external' ? '120 GB' : '18 GB';
    $('#review-destination').textContent = state.destination === 'external' ? 'Backup no SSD — outro dispositivo' : 'Pasta de arquivos — mesmo volume';
    $('#review-volume-warning').hidden = state.destination !== 'same';
    $('#confirm-copy').focus({ preventScroll: true });
    announce(`Revisão: ${selected().length} arquivos, ${$('#review-size').textContent}. Espaço disponível: ${$('#review-space').textContent}.`);
  });
  $('#back-copy').addEventListener('click', () => {
    state.phase = 'selection'; $('#copy-review').hidden = true; $('#copy-selection').hidden = false; $('#review-copy').focus({ preventScroll: true });
  });
  $('#confirm-copy').addEventListener('click', run);
  $('#retry-copy').addEventListener('click', run);
  $('#skip-copy').addEventListener('click', complete);
  $('#reset-copy').addEventListener('click', () => {
    stop(); state.phase = 'selection'; state.step = 0; state.queue = [];
    files.forEach(file => { file.status = 'pending'; file.selected = true; });
    choices.forEach(choice => { choice.checked = true; }); destination.value = 'external';
    $('#copy-selection').hidden = false; $('#copy-review').hidden = true; $('#copy-operation').hidden = true;
    renderSelection(); renderOperation(); $('#review-copy').focus({ preventScroll: true });
  });
  motionPreference.addEventListener('change', event => { if (event.matches && ['running', 'paused'].includes(state.phase)) complete(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  function selectMode(mode) {
    if (mode === 'copy') pauseCheck(); else pause();
    document.querySelectorAll('[data-demo-mode]').forEach(tab => {
      const active = tab.dataset.demoMode === mode;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $(`#panel-${tab.dataset.demoMode}`).hidden = !active;
    });
  }
  const tabs = [...document.querySelectorAll('[data-demo-mode]')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => selectMode(tab.dataset.demoMode));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs[1 - tabs.indexOf(tab)];
      selectMode(next.dataset.demoMode); next.focus();
    });
  });
  document.querySelector('[data-open-copy]').addEventListener('click', () => {
    dialog.showModal(); document.body.classList.add('dialog-open');
    selectMode('copy'); $('#tab-copy').focus({ preventScroll: true });
  });
  renderSelection();
  return { selectMode, pause };
}
