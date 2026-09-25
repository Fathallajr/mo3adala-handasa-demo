import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const root = path.resolve(process.cwd());
const contentDir = path.join(root, 'content');
const assetsDir = path.join(root, 'src', 'assets');
const outJson = path.join(assetsDir, 'content.json');

/** @typedef {{slug:string,title:string,description:string,date:string, html:string}} Post */

function readPosts() {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const html = marked.parse(content);
    const slug = data.slug || path.basename(file, '.md');
    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      html: String(html)
    });
  }
  // sort by date desc
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function main() {
  ensureDir(assetsDir);
  const posts = readPosts();
  const content = { posts };
  fs.writeFileSync(outJson, JSON.stringify(content, null, 2), 'utf8');

  // Route discovery is maintained separately because the Angular router is the
  // source of truth; this content generator must not reintroduce removed URLs.
  console.log(`Wrote ${posts.length} posts to assets/content.json; route files were left unchanged.`);
}

main();


