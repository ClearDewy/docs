import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const roots = [
  { directory: path.resolve("docs/ai"), track: "ai" },
  { directory: path.resolve("docs/embedded"), track: "embedded" },
  { directory: path.resolve("docs/music"), track: "music", category: "音乐" },
  { directory: path.resolve("docs/photography"), track: "photography", category: "摄影" },
];
const interactiveRoot = path.resolve("docs/.vitepress/theme/components/interactive");
const common = ["title", "date", "type", "status", "track", "description"];
const teaching = ["prerequisites", "outcomes", "estimated"];
const types = new Set(["overview", "lesson", "lab", "reference", "case-study", "review"]);
const statuses = new Set(["outline", "draft", "learnable", "verified", "stale"]);
const failures = [];

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(target) : entry.name.endsWith(".md") ? [target] : [];
  }));
  return nested.flat();
}

async function vueFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? vueFiles(target) : entry.name.endsWith(".vue") ? [target] : [];
  }));
  return nested.flat();
}

for (const root of roots) {
  const files = await markdownFiles(root.directory);
  for (const file of files) {
  const text = await readFile(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
  if (!match) {
    failures.push(`${relative}: missing frontmatter`);
    continue;
  }
  const hasKey = (key) => new RegExp(`^${key}:\\s*\\S`, "m").test(match[1]);
  for (const key of common) if (!hasKey(key)) failures.push(`${relative}: missing ${key}`);
  const value = (key) => match[1].match(new RegExp(`^${key}:\\s*([^\\r\\n]+)`, "m"))?.[1]?.trim();
  const type = value("type");
  const status = value("status");
  const track = value("track");
  if (type && !types.has(type)) failures.push(`${relative}: invalid type ${type}`);
  if (status && !statuses.has(status)) failures.push(`${relative}: invalid status ${status}`);
  if (track && track !== root.track) failures.push(`${relative}: expected track ${root.track}, got ${track}`);
  if (root.category && !new RegExp(`(?:^|\\n)categories:\\s*(?:\\[[^\\]]*${root.category}[^\\]]*\\]|(?:\\r?\\n[ \\t]+-[ \\t]+${root.category}(?:\\r?\\n|$)))`, "m").test(match[1])) {
    failures.push(`${relative}: categories missing ${root.category}`);
  }
  if (["lesson", "lab", "review"].includes(type)) {
    for (const key of teaching) if (!hasKey(key)) failures.push(`${relative}: ${type} missing ${key}`);
  }
  if (/^pageClass:\s*guided-lab-page\s*$/m.test(match[1])) {
    if (!/^aside:\s*false\s*$/m.test(match[1])) failures.push(`${relative}: guided lab must hide the right outline with aside: false`);
    if (!/^docAnalysis:\s*(?:\{[^}\r\n]*readingTime:\s*false[^}\r\n]*\}|\r?\n[ \t]+readingTime:\s*false\s*$)/m.test(match[1])) {
      failures.push(`${relative}: guided lab must hide automatic reading time`);
    }
    const estimated = value("estimated")?.replace(/^['"]|['"]$/g, "");
    if (estimated && !text.slice(match[0].length).includes(estimated)) {
      failures.push(`${relative}: guided lab body must show its estimated practice time (${estimated})`);
    }
  }
  if (root.track === "ai" && type === "review" && ["learnable", "verified"].includes(status) && !text.includes("<KnowledgeQuiz")) {
    failures.push(`${relative}: ${status} review missing KnowledgeQuiz`);
  }
  }
}

for (const file of await vueFiles(interactiveRoot)) {
  const text = await readFile(file, "utf8");
  if (!text.includes("<canvas")) continue;
  const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
  if (!/<canvas[\s\S]*?role=["']img["']/.test(text)) {
    failures.push(`${relative}: Canvas missing role="img"`);
  }
  if (!/<canvas[\s\S]*?(?:aria-label|:aria-label)=/.test(text)) {
    failures.push(`${relative}: Canvas missing accessible label`);
  }
  if (!/<details\b|fallback/.test(text)) {
    failures.push(`${relative}: Canvas missing static fallback`);
  }
  if (/requestAnimationFrame|setInterval/.test(text) && !/prefers-reduced-motion/.test(text)) {
    failures.push(`${relative}: animated Canvas missing prefers-reduced-motion handling`);
  }
  if (/setInterval/.test(text) && (!/clearInterval/.test(text) || !/onBeforeUnmount/.test(text))) {
    failures.push(`${relative}: interval playback missing unmount cleanup`);
  }
}

if (failures.length) {
  console.error(`Content contract failed (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("AI, embedded, music, photography, and visualization contracts passed");
