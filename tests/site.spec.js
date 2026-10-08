import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const metadataUrl = 'https://raw.githubusercontent.com/Benfic4rthur/JaCopiei-Releases/main/latest.json';
const releases = 'https://github.com/Benfic4rthur/JaCopiei-Releases/releases';
const metadata = {
  version: '0.3.0', build: '6', minimumMacOSVersion: '14.0', architectures: ['arm64', 'x86_64'],
  downloadUrl: `${releases}/download/v0.3.0/JaCopiei-0.3.0-universal.dmg`, releaseNotesUrl: `${releases}/tag/v0.3.0`,
  sha256: '108c618ed963449d17f9e8ff3fc86a243119af6dae11810f10ac402a9d72ce77', sizeBytes: 2973805,
  channel: 'preview', codeSigning: 'ad-hoc-not-notarized', automaticUpdatesAvailable: false,
};
test.beforeEach(async ({ page }) => { await page.route(metadataUrl, route => route.fulfill({ json: metadata })); });
async function openDemo(page) {
  await page.locator('.hero-actions [data-open-demo]').click();
  await expect(page.locator('#demo-dialog')).toBeVisible();
}
async function startCheck(page) {
  await openDemo(page);
  await expect(page.locator('#start-demo')).toBeDisabled();
  await page.locator('#choose-source').click(); await page.locator('#choose-destination').click();
  await page.locator('#start-demo').click();
}
async function initialResult(page) {
  await startCheck(page);
  if (await page.locator('#finish-demo').isVisible()) await page.locator('#finish-demo').click();
  await expect(page.locator('#demo-result')).toContainText('48 de 50 arquivos têm cópia confirmada.');
}
async function openCopy(page) { await initialResult(page); await page.getByRole('button', { name: 'Copiar itens sem cópia…', exact: true }).click(); }
async function startCopy(page) { await page.locator('#review-copy').click(); await page.locator('#confirm-copy').click(); }

test('conferência pausa, continua, filtra e busca arquivos fictícios', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await startCheck(page);
  await expect.poll(() => page.locator('#demo-progress').getAttribute('aria-valuenow')).not.toBe('0');
  await page.locator('#pause-demo').click();
  const paused = await page.locator('#demo-progress').getAttribute('aria-valuenow');
  await page.waitForTimeout(300); await expect(page.locator('#demo-progress')).toHaveAttribute('aria-valuenow', paused);
  await page.locator('#pause-demo').click(); await page.locator('#finish-demo').click();
  await page.getByRole('button', { name: 'Sem cópia encontrada 2', exact: true }).click();
  await expect(page.locator('#demo-files tr')).toHaveCount(2);
  await page.locator('#demo-search').fill('IMG_1048'); await expect(page.locator('#demo-files tr')).toHaveCount(1);
  await expect(page.locator('#demo-files')).toContainText('IMG_1048.jpg');
  await page.locator('#demo-search').fill('nenhum'); await expect(page.locator('.no-results')).toHaveText('Nenhum arquivo corresponde à busca e ao filtro.');
  await page.locator('#demo-search').clear();
  await page.getByRole('button', { name: 'Cópia encontrada 48', exact: true }).click(); await expect(page.locator('#demo-files tr')).toHaveCount(48);
  await page.getByRole('button', { name: 'Todos 50', exact: true }).click(); await expect(page.locator('#demo-files tr')).toHaveCount(50);
  await page.locator('#start-demo').click(); await expect(page.locator('#demo-result')).toBeHidden();
  await page.locator('#finish-demo').click(); expect(errors).toEqual([]);
});

test('conferência termina sem pular a animação', async ({ page }) => {
  await page.goto('/'); await startCheck(page);
  await expect(page.locator('#demo-result')).toBeVisible({ timeout: 12000 });
  await expect(page.locator('#demo-files .found')).toHaveCount(48); await expect(page.locator('#demo-files .missing')).toHaveCount(2);
});

test('fluxo completo só atualiza 50/50 depois da nova comparação', async ({ page }) => {
  await page.goto('/'); await openCopy(page); await startCopy(page);
  await expect(page.locator('#copy-results')).toContainText('Conferindo conteúdo…');
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(0);
  await expect(page.locator('#copy-summary')).toHaveText('48 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-operation-title')).toHaveText('4. Conferindo o conjunto novamente', { timeout: 6000 });
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(2);
  await expect(page.locator('#copy-summary')).toHaveText('48 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.', { timeout: 5000 });
  await expect(page.locator('#copy-results')).toContainText('SSD das cópias/Fotos da viagem/Praia/IMG_1048 (1).jpg');
  await page.locator('#tab-check').click(); await expect(page.locator('#demo-result')).toContainText('50 de 50');
  await expect(page.locator('#demo-files .found')).toHaveCount(50); await expect(page.locator('#demo-files .missing')).toHaveCount(0);
  await expect(page.locator('#additional-destination')).toHaveText('SSD das cópias');
});

test('seleção parcial, revisão de espaço e aviso sobre mesmo volume', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await openCopy(page);
  await page.locator('#select-all-copy').uncheck(); await expect(page.locator('#review-copy')).toBeDisabled();
  await page.locator('[name="copy-file"]').first().check(); await page.locator('#copy-destination').selectOption('same');
  await expect(page.locator('#same-volume-warning')).toBeVisible(); await page.locator('#review-copy').click();
  await expect(page.locator('#review-count')).toHaveText('1 arquivo'); await expect(page.locator('#review-size')).toHaveText('8,2 MB');
  await expect(page.locator('#review-space')).toHaveText('18 GB'); await expect(page.locator('#review-volume-warning')).toBeVisible();
  await page.locator('#confirm-copy').click(); await expect(page.locator('#copy-summary')).toHaveText('49 de 50 arquivos têm cópia confirmada.');
  await page.locator('#reset-copy').click(); await expect(page.locator('#copy-summary')).toHaveText('48 de 50 arquivos têm cópia confirmada.');
  await page.locator('#review-copy').click(); await expect(page.locator('#review-size')).toHaveText('14,6 MB'); await expect(page.locator('#review-space')).toHaveText('120 GB');
  await page.locator('#confirm-copy').click(); await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
});

test('cancelamento conserva confirmados e retry pede novo destino', async ({ page }) => {
  await page.goto('/'); await openCopy(page); await startCopy(page);
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(1, { timeout: 4000 });
  await page.locator('#pause-copy').click(); const paused = await page.locator('#copy-progress').getAttribute('aria-valuenow');
  await page.waitForTimeout(300); await expect(page.locator('#copy-progress')).toHaveAttribute('aria-valuenow', paused);
  await page.locator('#cancel-copy').click();
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(1); await expect(page.locator('#copy-results .pending')).toHaveCount(1);
  await page.locator('#retry-copy').click(); await expect(page.locator('#copy-destination')).toHaveValue('');
  await expect(page.locator('#review-copy')).toBeDisabled(); await page.locator('#copy-destination').selectOption('external');
  await page.locator('#review-copy').click(); await expect(page.locator('#review-count')).toHaveText('1 arquivo');
  await page.locator('#confirm-copy').click(); await page.locator('#skip-copy').click();
  await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(2);
});

test('uma seleção parcial permite copiar o restante sem apagar a primeira confirmação', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await openCopy(page);
  await page.locator('[name="copy-file"]').last().uncheck(); await page.locator('#copy-destination').selectOption('same');
  await startCopy(page); await expect(page.locator('#copy-summary')).toHaveText('49 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#retry-copy')).toHaveText('Copiar itens restantes…');
  await page.locator('#tab-check').click(); await page.locator('[data-open-copy]').click();
  await expect(page.locator('[name="copy-file"]:visible')).toHaveCount(1);
  await expect(page.locator('[name="copy-file"]').first()).toBeDisabled();
  await expect(page.locator('#copy-destination')).toHaveValue(''); await expect(page.locator('#review-copy')).toBeDisabled();
  await page.locator('#copy-destination').selectOption('external'); await page.locator('#review-copy').click();
  await expect(page.locator('#review-count')).toHaveText('1 arquivo'); await expect(page.locator('#review-size')).toHaveText('6,4 MB');
  await page.locator('#confirm-copy').click(); await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(2);
  await expect(page.locator('#copy-results')).toContainText('Pasta de arquivos/Fotos da viagem/Praia/IMG_1048 (1).jpg');
  await expect(page.locator('#copy-results')).toContainText('SSD das cópias/Fotos da viagem/Praia/IMG_1049.jpg');
});

test('interromper nova comparação conserva cópias e repete somente a leitura', async ({ page }) => {
  await page.goto('/'); await openCopy(page); await startCopy(page);
  await expect(page.locator('#copy-operation-title')).toHaveText('4. Conferindo o conjunto novamente', { timeout: 6000 });
  await page.locator('#cancel-copy').click(); await expect(page.locator('#copy-results .confirmed')).toHaveCount(2);
  await expect(page.locator('#retry-copy')).toHaveText('Conferir conjunto novamente');
  await page.locator('#retry-copy').click(); await expect(page.locator('#copy-selection')).toBeHidden();
  await page.locator('#skip-copy').click(); await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
});

test('metadados oficiais configuram DMG, versão, compatibilidade e aviso', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-release-state', 'ready');
  for (const link of await page.locator('[data-download-cta]').all()) {
    await expect(link).toHaveText('Baixar para macOS'); await expect(link).toHaveAttribute('href', metadata.downloadUrl);
  }
  await expect(page.locator('[data-release-notes]')).toHaveAttribute('href', metadata.releaseNotesUrl);
  await expect(page.locator('[data-compatibility]').first()).toHaveText('macOS 14 ou superior · Apple Silicon e Intel');
  await expect(page.locator('#hero-download-warning')).toContainText('sem notarização da Apple');
  await expect(page.locator('#download-warning')).toContainText('Atualização automática desativada');
  await expect(page.locator('[data-metadata-status]')).toHaveText('v0.3.0 · DMG 3 MB');
});

for (const mode of ['network', 'invalid', 'source-archive']) {
  test(`fallback do download quando metadados falham: ${mode}`, async ({ page }) => {
    await page.unroute(metadataUrl);
    await page.route(metadataUrl, route => mode === 'network' ? route.abort() : route.fulfill({ json: mode === 'invalid' ? { version: '0.3.0' } : { ...metadata, downloadUrl: `${releases}/download/v0.3.0/source.zip` } }));
    await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-release-state', 'fallback');
    for (const link of await page.locator('[data-download-cta]').all()) await expect(link).toHaveAttribute('href', releases);
    await expect(page.locator('[data-metadata-status]')).toContainText('Não foi possível consultar a versão');
    await initialResult(page); // Failure of remote metadata never blocks the local demonstration.
  });
}

test('FAQ, recursos e navegação preservam limites atuais e preço planejado', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  for (const details of await page.locator('.faq-list details, .feature-detail, .upcoming-details').all()) {
    await details.locator('summary').click(); await expect(details).toHaveAttribute('open', '');
    await details.locator('summary').click(); await expect(details).not.toHaveAttribute('open', '');
  }
  const missing = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.querySelector(link.getAttribute('href'))).map(link => link.getAttribute('href')));
  expect(missing).toEqual([]);
  await expect(page.locator('input[type="file"], input[type="email"], form')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Assinar agora' })).toHaveCount(0);
  await expect(page.locator('[data-price-note]')).toHaveText('Preço previsto para o lançamento comercial.');
  const stale = await page.locator('body').textContent(); expect(stale).not.toMatch(/0\.2\.0|Em desenvolvimento para a versão 0\.3|Lançamento em preparação|experimental|produto inacabado|serviço de licenças ainda não foi implementado/i);
  await page.locator('.desktop-nav a[href="#preco"]').click(); await expect(page).toHaveURL(/#preco$/);
});

for (const width of [1440, 768, 390, 320]) {
  test(`layout e acessibilidade em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-release-state', 'ready');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width < 861) {
      await page.getByRole('button', { name: 'Abrir menu' }).click(); await page.locator('#mobile-nav a[href="#duvidas"]').click();
      await expect(page.locator('#mobile-nav')).toBeHidden();
    }
    const base = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(base.violations).toEqual([]);
    await openCopy(page); await startCopy(page); await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
    const demo = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(demo.violations).toEqual([]);
    expect(await page.locator('#demo-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `test-results/copy-${width}.png` });
    await page.getByRole('button', { name: 'Fechar demonstração' }).click();
    if ([1440, 390].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `test-results/site-${width}.png`, fullPage: true });
      await page.screenshot({ path: `test-results/hero-${width}.png` });
    }
  });
}

test('teclado, tabs e fechamento da janela com movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await openDemo(page);
  await page.locator('#tab-check').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#tab-check')).toBeFocused();
  await page.locator('#choose-source').focus(); await page.keyboard.press('Enter');
  await page.locator('#choose-destination').focus(); await page.keyboard.press('Enter');
  await page.locator('#start-demo').focus(); await page.keyboard.press('Enter');
  await page.locator('#tab-check').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#tab-copy')).toBeFocused();
  await startCopy(page); await expect(page.locator('#pause-copy')).toBeHidden();
  await page.keyboard.press('Escape'); await expect(page.locator('#demo-dialog')).toBeHidden();
  await expect(page.locator('.hero-actions [data-open-demo]')).toBeFocused();
  const summary = page.locator('.faq-list summary').first(); await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', ''); await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open', '');
});
