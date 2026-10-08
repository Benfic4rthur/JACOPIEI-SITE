import { product } from './config.js';

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

export async function loadReleaseMetadata() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(product.release.metadataUrl, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('Release metadata unavailable');
    const data = validateRelease(await response.json());
    document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${data.version}`; });
    document.querySelectorAll('[data-download-cta]').forEach(el => {
      el.href = data.downloadUrl;
      el.textContent = data.experimental ? 'Baixar versão experimental para macOS' : 'Baixar para macOS';
    });
    document.querySelectorAll('[data-release-notes]').forEach(el => { el.href = data.releaseNotesUrl; });
    document.querySelectorAll('[data-launch-status]').forEach(el => { el.textContent = data.experimental ? 'Versão experimental disponível' : 'Disponível para macOS'; });
    const architectures = data.architectures.map(value => value === 'arm64' ? 'Apple Silicon' : 'Intel').join(' e ');
    const minimum = data.minimumMacOSVersion.replace(/\.0$/, '');
    document.querySelectorAll('[data-compatibility]').forEach(el => { el.textContent = `macOS ${minimum} ou superior · ${architectures}`; });
    const details = [];
    if (data.codeSigning === 'ad-hoc-not-notarized') details.push('Assinatura local, sem notarização da Apple. O macOS pode bloquear o instalador baixado.');
    else if (data.experimental) details.push('Distribuição experimental. Consulte as notas da versão antes de instalar.');
    if (!data.automaticUpdatesAvailable) details.push('Atualização automática desativada.');
    document.querySelectorAll('[data-distribution-warning]').forEach(el => { el.textContent = details.join(' '); el.hidden = !details.length; });
    document.querySelectorAll('[data-metadata-status]').forEach(el => {
      const size = Number.isFinite(data.sizeBytes) ? ` · DMG ${(data.sizeBytes / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : '';
      el.textContent = `v${data.version}${size}`;
    });
    document.documentElement.dataset.releaseState = 'ready';
    return data;
  } catch {
    document.querySelectorAll('[data-download-cta]').forEach(el => { el.href = product.release.releasesUrl; el.textContent = 'Ver downloads experimentais'; });
    document.querySelectorAll('[data-metadata-status]').forEach(el => { el.textContent = 'Não foi possível consultar a versão. Abra a página de releases para baixar.'; });
    document.documentElement.dataset.releaseState = 'fallback';
    return null;
  } finally { clearTimeout(timeout); }
}
