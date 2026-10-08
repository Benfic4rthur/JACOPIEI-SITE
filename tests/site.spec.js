import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openDemo(page) { await page.locator('.hero-actions [data-primary-cta]').click(); await expect(page.locator('#demo-dialog')).toBeVisible(); }

test('conferência pode pausar, continuar, pular e filtrar resultados reais', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await openDemo(page);
  await expect(page.locator('#demo-files tr')).toHaveCount(50);
  await page.getByRole('button', { name: 'Conferir cópias', exact: true }).click();
  await expect.poll(() => page.locator('#demo-progress').getAttribute('aria-valuenow')).not.toBe('0');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const paused = await page.locator('#demo-progress').getAttribute('aria-valuenow');
  await page.waitForTimeout(350);
  await expect(page.locator('#demo-progress')).toHaveAttribute('aria-valuenow', paused);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect.poll(() => page.locator('#demo-progress').getAttribute('aria-valuenow')).not.toBe(paused);
  await page.getByRole('button', { name: 'Ver resultado agora' }).click();
  await expect(page.locator('#demo-result')).toContainText('48 de 50 arquivos têm cópia confirmada.');
  await page.getByRole('button', { name: 'Sem cópia encontrada 2', exact: true }).click();
  await expect(page.locator('#demo-files tr')).toHaveCount(2);
  await expect(page.locator('#demo-files')).toContainText('IMG_1048.jpg');
  await expect(page.locator('#demo-files')).toContainText('IMG_1049.jpg');
  await page.getByRole('button', { name: 'Cópia encontrada 48', exact: true }).click();
  await expect(page.locator('#demo-files tr')).toHaveCount(48);
  await expect(page.locator('#demo-files')).not.toContainText('IMG_1048.jpg');
  await page.getByRole('button', { name: 'Todos 50', exact: true }).click();
  await expect(page.locator('#demo-files tr')).toHaveCount(50);
  await page.getByRole('button', { name: 'Repetir demonstração' }).click();
  await expect(page.locator('#demo-result')).toBeHidden();
  await expect(page.locator('#demo-files tr')).toHaveCount(50);
  await page.getByRole('button', { name: 'Ver resultado agora' }).click();
  expect(errors).toEqual([]);
});

test('conferência termina sozinha e não encontra os dois últimos arquivos', async ({ page }) => {
  await page.goto('/');
  await openDemo(page);
  await page.locator('#start-demo').click();
  await expect(page.locator('#demo-result')).toBeVisible({ timeout: 12000 });
  await expect(page.locator('#demo-progress')).toHaveAttribute('aria-valuenow', '50');
  await expect(page.locator('#demo-files .found')).toHaveCount(48);
  await expect(page.locator('#demo-files .missing')).toHaveCount(2);
});

test('movimento reduzido tem resultado imediato e FAQ acessível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await openDemo(page);
  await page.locator('#start-demo').click();
  await expect(page.locator('#demo-result')).toBeVisible();
  await expect(page.locator('#pause-demo')).toBeHidden();
  await page.getByRole('button', { name: 'Sem cópia encontrada 2', exact: true }).click();
  await expect(page.locator('#demo-files tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Fechar demonstração' }).click();
  const summary = page.locator('.faq-list summary').first();
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open', '');
});

test('FAQ abre e fecha, navegação resolve e pré-lançamento não oferece download', async ({ page }) => {
  await page.goto('/');
  for (const details of await page.locator('.faq-list details').all()) {
    await details.locator('summary').click(); await expect(details).toHaveAttribute('open', '');
    await page.waitForTimeout(220);
    await details.locator('summary').click(); await expect(details).not.toHaveAttribute('open', '');
  }
  const missing = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.querySelector(link.getAttribute('href'))).map(link => link.getAttribute('href')));
  expect(missing).toEqual([]);
  await expect(page.getByRole('link', { name: 'Baixar para macOS' })).toHaveCount(0);
  await expect(page.locator('input[type="file"], input[type="email"], form')).toHaveCount(0);
  await page.locator('.desktop-nav a[href="#preco"]').click();
  await expect(page).toHaveURL(/#preco$/);
});

for (const width of [1440, 768, 390, 320]) {
  test(`layout e acessibilidade em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width < 861) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
      await page.locator('#mobile-nav a[href="#duvidas"]').click();
      await expect(page.locator('#mobile-nav')).toBeHidden();
      await expect(page).toHaveURL(/#duvidas$/);
    }
    const baseAccessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(baseAccessibility.violations).toEqual([]);
    await openDemo(page);
    await page.locator('#start-demo').click();
    await page.getByRole('button', { name: 'Sem cópia encontrada 2', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('button', { name: 'Fechar demonstração' }).click();
    if (width === 1440 || width === 390) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/site-${width}.png`, fullPage: true });
      await page.screenshot({ path: `test-results/hero-${width}.png` });
    }
  });
}


test('0.3 seleciona alguns ou todos e confirma somente depois da conferência', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Experimentar a próxima versão' }).click();
  await expect(page.locator('#panel-copy')).toBeVisible();
  await expect(page.locator('.development-banner')).toContainText('Em desenvolvimento para a versão 0.3');
  await page.locator('#select-all-copy').uncheck();
  await expect(page.locator('#review-copy')).toBeDisabled();
  await page.locator('[name="copy-file"]').first().check();
  await page.locator('#copy-destination').selectOption('same');
  await expect(page.locator('#same-volume-warning')).toBeVisible();
  await page.locator('#review-copy').click();
  await expect(page.locator('#review-count')).toHaveText('1 arquivo');
  await expect(page.locator('#review-size')).toHaveText('8,2 MB');
  await expect(page.locator('#review-space')).toHaveText('18 GB');
  await expect(page.locator('#review-volume-warning')).toBeVisible();
  await page.locator('#confirm-copy').click();
  await expect(page.locator('#copy-results')).toContainText('Conferindo conteúdo…');
  await expect(page.locator('#copy-summary')).toHaveText('48 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-summary')).toHaveText('49 de 50 arquivos têm cópia confirmada.', { timeout: 5000 });
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(1);
  await page.locator('#reset-copy').click();
  await page.locator('#review-copy').click();
  await expect(page.locator('#review-size')).toHaveText('14,6 MB');
  await expect(page.locator('#review-space')).toHaveText('120 GB');
  await page.locator('#confirm-copy').click();
  await page.locator('#skip-copy').click();
  await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
});

test('0.3 pausa, cancela sem confirmar e permite tentar os pendentes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Experimentar a próxima versão' }).click();
  await page.locator('#review-copy').click();
  await page.locator('#confirm-copy').click();
  await expect(page.locator('#copy-results')).toContainText('Copiando…');
  await page.locator('#pause-copy').click();
  const progress = await page.locator('#copy-progress').getAttribute('aria-valuenow');
  await page.waitForTimeout(350);
  await expect(page.locator('#copy-progress')).toHaveAttribute('aria-valuenow', progress);
  await page.locator('#cancel-copy').click();
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(0);
  await expect(page.locator('#copy-results .pending')).toHaveCount(2);
  await page.locator('#retry-copy').click();
  await page.locator('#skip-copy').click();
  await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#copy-results .confirmed')).toHaveCount(2);
});

test('janela por teclado, recursos expansíveis e 0.3 no celular com movimento reduzido', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const feature = page.locator('.feature-detail').first();
  await feature.locator('summary').click();
  await expect(feature).toHaveAttribute('open', '');
  await expect(feature).toContainText('conteúdo idêntico');
  await openDemo(page);
  await page.locator('#tab-check').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-copy')).toBeFocused();
  await expect(page.locator('#panel-copy')).toBeVisible();
  await page.locator('#review-copy').click();
  await page.locator('#confirm-copy').click();
  await expect(page.locator('#copy-summary')).toHaveText('50 de 50 arquivos têm cópia confirmada.');
  await expect(page.locator('#pause-copy')).toBeHidden();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.locator('#demo-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/copy-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#demo-dialog')).toBeHidden();
  await expect(page.locator('.hero-actions [data-primary-cta]')).toBeFocused();
});
