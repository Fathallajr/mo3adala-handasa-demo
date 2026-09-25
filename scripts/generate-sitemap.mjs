import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const distRoot = path.join(root, 'dist');
const assetsDir = path.join(root, 'src', 'assets');
const routesFile = path.join(assetsDir, 'routes.json');

const SITE_URL = (process.env.NG_SITE_URL || 'https://www.appmo3adla.com').replace(/\/$/, '');

function readRoutes() {
  if (!fs.existsSync(routesFile)) return ['/'];
  try {
    const data = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
    if (Array.isArray(data)) return data;
  } catch {}
  return ['/'];
}

function buildSitemap(urls) {
  const items = urls
    .map(u => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${u}`)}</loc>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[character]));
}

function main() {
  const urls = readRoutes();
  fs.mkdirSync(distRoot, { recursive: true });
  const sitemap = buildSitemap(urls);
  fs.writeFileSync(path.join(distRoot, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /private/\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');
  console.log('Generated sitemap.xml and robots.txt');
}

main();


