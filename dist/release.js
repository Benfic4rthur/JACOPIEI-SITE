import { product } from './config.js';

// Count only the DMG installers. ZIPs, blockmaps and metadata are extra assets
// for the same release, so adding them would inflate the public download total.
export async function fetchAllReleaseDownloads(signal) {
  let total = 0;
  for (let page = 1; ; page += 1) {
    const response = await fetch(`${product.release.apiUrl}?per_page=100&page=${page}`, { signal });
    if (!response.ok) throw new Error('Release history unavailable');
    const releases = await response.json();
    if (!Array.isArray(releases)) throw new Error('Invalid release history');
    for (const release of releases) {
      if (!release || release.draft || !Array.isArray(release.assets)) continue;
      for (const asset of release.assets) {
        if (!asset || typeof asset.name !== 'string' || !/\.dmg$/i.test(asset.name)) continue;
        if (!Number.isSafeInteger(asset.download_count) || asset.download_count < 0) throw new Error('Invalid download count');
        total += asset.download_count;
      }
    }
    if (releases.length < 100) return total;
  }
}

export async function loadReleaseDownloads() {
  const status = document.querySelector('[data-download-total]');
  if (!status) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const total = await fetchAllReleaseDownloads(controller.signal);
    status.textContent = `Downloads acumulados: ${total.toLocaleString('pt-BR')}`;
    status.title = 'Instaladores DMG de todas as releases publicadas no GitHub';
  } catch {
    status.textContent = 'Downloads acumulados indisponíveis no momento.';
    status.removeAttribute('title');
  } finally {
    clearTimeout(timeout);
  }
}

// A failed/invalid manifest always leads to the real releases page, never a source archive.
export function validateRelease(data) {
  if (!data || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(data.version)) throw new Error('Invalid release version');
  const download = new URL(data.downloadUrl);
  const notes = new URL(data.releaseNotesUrl);
  const base = new URL(product.release.repositoryUrl);
  if (download.protocol !== 'https:' || download.origin !== base.origin || !download.pathname.startsWith(`${base.pathname}/releases/download/v${data.version}/`) || !download.pathname.endsWith('.dmg')) throw new Error('Invalid installer URL');
  if (notes.origin !== base.origin || notes.pathname !== `${base.pathname}/releases/tag/v${data.version}`) throw new Error('Invalid release notes URL');
  if (!/^\d+(?:\.\d+){0,2}$/.test(data.minimumMacOSVersion)) throw new Error('Invalid macOS version');
  if (!Array.isArray(data.architectures) || !data.architectures.length || data.architectures.some(value => !['arm64', 'x86_64'].includes(value))) throw new Error('Invalid architectures');
  if (typeof data.automaticUpdatesAvailable !== 'boolean' || typeof data.channel !== 'string' || typeof data.codeSigning !== 'string') throw new Error('Invalid distribution state');
  return {
    ...data,
    downloadUrl: download.href,
    releaseNotesUrl: notes.href,
    experimental: data.channel === 'preview' || data.codeSigning !== 'developer-id-notarized',
  };
}

function showNeutralRelease(message) {
  document.querySelectorAll('[data-version]').forEach(el => { el.textContent = ''; el.hidden = true; });
  document.querySelectorAll('[data-version-divider]').forEach(el => { el.hidden = true; });
  document.querySelectorAll('[data-download-cta]').forEach(el => { el.href = product.release.releasesUrl; el.textContent = 'Ver downloads'; });
  document.querySelectorAll('[data-release-notes]').forEach(el => { el.href = product.release.releasesUrl; });
  document.querySelectorAll('[data-launch-status]').forEach(el => { el.textContent = 'Downloads no GitHub'; });
  document.querySelectorAll('[data-compatibility]').forEach(el => { el.textContent = 'Consulte a compatibilidade nas notas da versão.'; });
  document.querySelectorAll('[data-distribution-warning], [data-installation-info]').forEach(el => {
    el.textContent = 'Consulte as notas da versão para orientações de instalação e atualização.'; el.hidden = false;
  });
  document.querySelectorAll('[data-metadata-status]').forEach(el => { el.textContent = message; });
}

export async function loadReleaseMetadata() {
  showNeutralRelease('Consultando a versão disponível no GitHub…');
  document.documentElement.dataset.releaseState = 'loading';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(product.release.metadataUrl, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('Release metadata unavailable');
    const data = validateRelease(await response.json());
    document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${data.version}`; el.hidden = false; });
    document.querySelectorAll('[data-version-divider]').forEach(el => { el.hidden = false; });
    document.querySelectorAll('[data-download-cta]').forEach(el => {
      el.href = data.downloadUrl;
      el.textContent = 'Baixar para macOS';
    });
    document.querySelectorAll('[data-release-notes]').forEach(el => { el.href = data.releaseNotesUrl; });
    document.querySelectorAll('[data-launch-status]').forEach(el => { el.textContent = 'Disponível para macOS'; });
    const architectures = data.architectures.map(value => value === 'arm64' ? 'Apple Silicon' : 'Intel').join(' e ');
    const minimum = data.minimumMacOSVersion.replace(/\.0$/, '');
    document.querySelectorAll('[data-compatibility]').forEach(el => { el.textContent = `macOS ${minimum} ou superior · ${architectures}`; });
    const details = [];
    if (data.codeSigning === 'ad-hoc-not-notarized') details.push('Assinatura local, sem notarização da Apple. O macOS pode bloquear o instalador baixado.');
    else if (data.codeSigning !== 'developer-id-notarized') details.push('Consulte as notas da versão para detalhes de instalação.');
    if (!data.automaticUpdatesAvailable) details.push('Atualização automática desativada.');
    document.querySelectorAll('[data-distribution-warning]').forEach(el => { el.textContent = details.join(' '); el.hidden = !details.length; });
    document.querySelectorAll('[data-installation-info]').forEach(el => {
      el.textContent = details.length ? details.join(' ') : 'Baixe o instalador pelo site. Consulte as notas da versão para orientações de instalação e atualização.';
    });
    document.querySelectorAll('[data-metadata-status]').forEach(el => {
      const size = Number.isFinite(data.sizeBytes) ? ` · DMG ${(data.sizeBytes / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : '';
      el.textContent = `v${data.version}${size}`;
    });
    document.documentElement.dataset.releaseState = 'ready';
    return data;
  } catch {
    showNeutralRelease('Não foi possível consultar a versão. Abra a página de releases para baixar.');
    document.documentElement.dataset.releaseState = 'fallback';
    return null;
  } finally { clearTimeout(timeout); }
}
