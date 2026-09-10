import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const configPath = path.resolve("docs/.vitepress/config.ts");
const themePath = path.resolve("docs/.vitepress/theme/index.ts");
const homePath = path.resolve("docs/index.md");
const orbitPath = path.resolve("docs/public/knowledge-orbit.svg");
const [config, theme, home, orbit] = await Promise.all([
  readFile(configPath, "utf8"),
  readFile(themePath, "utf8"),
  readFile(homePath, "utf8"),
  readFile(orbitPath, "utf8"),
]);

const failures = [];
const tracks = [
  ["ai", "智能算法"],
  ["systems", "系统工程"],
  ["embedded", "嵌入式"],
  ["quant", "量化研究"],
  ["music", "音乐"],
  ["photography", "摄影"],
];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function routePath(route) {
  const clean = route.split(/[?#]/, 1)[0];
  if (!clean.startsWith("/")) return null;
  const relative = clean === "/" ? "index" : clean.replace(/^\//, "").replace(/\/$/, "/index");
  return path.resolve("docs", `${relative}.md`);
}

async function routeExists(route) {
  const target = routePath(route);
  if (!target) return true;
  return (await exists(target)) || (await exists(path.resolve(target.replace(/\.md$/, ""), "index.md")));
}

const routes = [...config.matchAll(/\blink:\s*["']([^"']+)["']/g)].map((match) => match[1]);
for (const route of new Set(routes)) {
  if (!(await routeExists(route))) failures.push(`docs/.vitepress/config.ts: unresolved internal route ${route}`);
}

for (const [slug, title] of tracks) {
  if (!config.includes(`{ text: "${title}", link: "/${slug}/" }`)) failures.push(`navigation missing ${title}`);
  if (!config.includes(`"/${slug}/": [`)) failures.push(`sidebar missing /${slug}/`);
  if (!home.includes(`link: /${slug}/`)) failures.push(`homepage feature missing /${slug}/`);
  if (!orbit.includes(title)) failures.push(`knowledge orbit missing ${title}`);
}

const globalComponents = [
  ["MusicIntervalLab", "./components/interactive/music/MusicIntervalLab.vue"],
  ["MusicHarmonyLab", "./components/interactive/music/MusicHarmonyLab.vue"],
  ["MusicRhythmLab", "./components/interactive/music/MusicRhythmLab.vue"],
  ["MusicSongLab", "./components/interactive/music/MusicSongLab.vue"],
  ["MusicTransposeLab", "./components/interactive/music/MusicTransposeLab.vue"],
  ["PhotographyLab", "./components/interactive/photography/PhotographyLab.vue"],
  ["PhotographySeeingLesson", "./components/interactive/photography/PhotographySeeingLesson.vue"],
  ["PhotographyToneLesson", "./components/interactive/photography/PhotographyToneLesson.vue"],
  ["PhotographyReferenceBoard", "./components/interactive/photography/PhotographyReferenceBoard.vue"],
];

for (const [name, importPath] of globalComponents) {
  if (!theme.includes(`${name}: () => import("${importPath}")`)) failures.push(`theme registration missing ${name}`);
  const componentPath = path.resolve("docs/.vitepress/theme", importPath);
  if (!(await exists(componentPath))) failures.push(`component file missing ${path.relative(process.cwd(), componentPath)}`);
}

const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const rCombining = /[\u0300-\u036f]/g;
const slugify = (value) => value.normalize("NFKD").replace(rCombining, "").replace(rControl, "").replace(rSpecial, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/^(\d)/, "_$1").toLowerCase();
const cleanHeading = (value) => value
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/[`*_~]/g, "")
  .trim();

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(target) : entry.name.endsWith(".md") ? [target] : [];
  }));
  return nested.flat();
}

const newTrackFiles = (await Promise.all([
  markdownFiles(path.resolve("docs/music")),
  markdownFiles(path.resolve("docs/photography")),
])).flat();
const sourceCache = new Map();
async function sourceOf(target) {
  if (!sourceCache.has(target)) sourceCache.set(target, await readFile(target, "utf8"));
  return sourceCache.get(target);
}

for (const sourcePath of newTrackFiles) {
  const source = await sourceOf(sourcePath);
  for (const match of source.matchAll(/(?<!!)\[[^\]]*\]\((\/(?:music|photography)\/[^)\s]*)\)/g)) {
    const href = match[1];
    const targetPath = routePath(href);
    if (!targetPath || !(await routeExists(href))) {
      failures.push(`${path.relative(process.cwd(), sourcePath)}: unresolved internal link ${href}`);
      continue;
    }
    const fragment = href.includes("#") ? decodeURIComponent(href.slice(href.indexOf("#") + 1)) : "";
    if (!fragment) continue;
    const targetSource = await sourceOf(targetPath);
    const slugs = new Set([...targetSource.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)].map((heading) => slugify(cleanHeading(heading[1]))));
    if (!slugs.has(fragment)) failures.push(`${path.relative(process.cwd(), sourcePath)}: unresolved heading ${href}`);
  }
}

const learningSequences = [
  ["/music/foundations", "/music/guitar-chords", "/music/major-key", "/music/rhythm", "/music/first-song", "/music/voice-and-review"],
  ["/photography/seeing", "/photography/capture", "/photography/tone", "/photography/color", "/photography/two-directions", "/photography/references", "/photography/practice", "/photography/material-collection"],
];

for (const sequence of learningSequences) {
  let previousPosition = -1;
  for (let index = 0; index < sequence.length; index += 1) {
    const route = sequence[index];
    const position = config.indexOf(`link: "${route}"`);
    if (position < previousPosition) failures.push(`sidebar learning order is inconsistent at ${route}`);
    previousPosition = position;
    const next = sequence[index + 1];
    if (next) {
      const source = await sourceOf(routePath(route));
      if (!source.includes(`](${next})`)) failures.push(`${route}: body does not link to next sidebar lesson ${next}`);
    }
  }
}

if (failures.length) {
  console.error(`Site structure check failed (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Site structure passed: ${new Set(routes).size} configured routes and ${globalComponents.length} new global components`);
