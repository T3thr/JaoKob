// JaoKob · documentation referential-integrity check.
// Usage:  node tests/docs/check-doc-links.mjs
//
// Walks every tracked Markdown file and checks each local link target exists:
//   [text](relative/path.md#anchor)  ·  [text](../dir/)  ·  <a href="..."> inside Markdown
// External links (http, https, mailto) and pure anchors (#...) are skipped.
// Absolute machine paths (file:///..., /Users/...) are errors: links must be relative.
// Also checks that every tracked HTML review page only references local files that exist.
// HTML templates (*-template.html) are skipped: their links resolve from the rendered page, which is checked.
// Exit code 1 if any link is broken.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const trackedSet = new Set(tracked);
const trackedDirs = new Set();
for (const f of tracked) for (let d = dirname(f); d !== '.'; d = dirname(d)) trackedDirs.add(d);

const exists = (rel) => {
  const n = normalize(rel).split(sep).join('/').replace(/\/$/, '');
  if (n === '' || n === '.') return true;
  return trackedSet.has(n) || trackedDirs.has(n); // tracked files only: an untracked local file must not hide a broken link
};

// Strip fenced and inline code so examples inside backticks are not treated as links.
const stripCode = (text) => text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');

const MD_LINK = /!?\[(?:[^\]\[]|\[[^\]]*\])*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const HTML_REF = /(?:href|src)\s*=\s*"([^"]+)"/g;

function classify(target) {
  if (/^(?:https?:|mailto:|data:|javascript:)/i.test(target)) return 'external';
  if (target.startsWith('#')) return 'anchor';
  if (/^file:\/\//i.test(target) || /^\/Users\//.test(target) || /^[a-z]+;\/\//i.test(target)) return 'absolute';
  return 'local';
}

const problems = [];
let checked = 0;
for (const file of tracked) {
  const isMd = file.endsWith('.md');
  const isHtml = file.endsWith('.html');
  if (!isMd && !isHtml) continue;
  // An HTML template resolves its links from the page it renders into; that rendered page is checked instead.
  if (/-template\.html$/.test(file)) continue;
  const text = readFileSync(join(root, file), 'utf8');
  const body = isMd ? stripCode(text) : text;
  const patterns = isMd ? [MD_LINK, HTML_REF] : [HTML_REF];
  for (const pattern of patterns) {
    for (const m of body.matchAll(pattern)) {
      const raw = m[1];
      const kind = classify(raw);
      if (kind === 'external' || kind === 'anchor') continue;
      checked += 1;
      if (kind === 'absolute') { problems.push({ file, target: raw, why: 'absolute machine path (use a relative link)' }); continue; }
      if (isHtml && /^(?:\$\{|\{\{)/.test(raw)) continue; // templated value built at runtime
      let target = raw.split('#')[0].split('?')[0];
      try { target = decodeURIComponent(target); } catch { /* keep raw */ }
      if (!target) continue;
      const rel = target.startsWith('/') ? target.slice(1) : join(dirname(file), target);
      if (!exists(rel)) problems.push({ file, target: raw, why: 'target does not exist' });
    }
  }
}

console.log('JaoKob documentation link check');
console.log(`ตรวจลิงก์ภายใน ${checked} ลิงก์ ใน Markdown และ HTML ที่ติดตามใน git`);
for (const p of problems) console.log(`ไม่ผ่าน · ${p.file} → ${p.target} · ${p.why}`);
console.log(problems.length ? `ผลรวม: ลิงก์เสีย ${problems.length} จุด` : 'ผลรวม: ผ่านทุกข้อ ไม่มีลิงก์เสีย');
process.exitCode = problems.length ? 1 : 0;
