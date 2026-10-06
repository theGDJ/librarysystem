/*
 * Downloads the embedded AI model (GGUF) — self-contained, no API keys, no
 * external services beyond PyPI/npm (works where huggingface.co is blocked).
 *
 *  npm run model:download
 *
 * Two modes:
 *  - Default: Gemma 3 270M (Q4_K_M, ~241 MB) assembled from the four
 *    "gemma3-270m-q4-k-m-gguf-part{1..4}" chunk wheels on PyPI.
 *    Wheel URLs are resolved live from the PyPI JSON API, with pinned
 *    fallbacks below.
 *  - Custom: set AI_MODEL_URL to any direct GGUF URL (e.g. an
 *    instruct-tuned model from Hugging Face) and AI_GGUF_PATH for the
 *    destination filename.
 */
import {
  createWriteStream,
  existsSync,
  writeFileSync,
  readFileSync,
  openSync,
  readSync,
  closeSync,
} from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.resolve(
  root,
  process.env.AI_GGUF_PATH ?? ".data/models/gemma-3-270m-q4_k_m.gguf",
);
const PART_PKGS = [1, 2, 3, 4].map((n) => `gemma3-270m-q4-k-m-gguf-part${n}`);
const PINNED_PART_URLS = [
  "https://files.pythonhosted.org/packages/84/a8/50fa262b5298009b82624fa3651929d9ed47a61779e7ac814e76844d26a8/gemma3_270m_q4_k_m_gguf_part1-1.0.0-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/a0/8f/5d243e447f3a01544a3d7bed75b10c7e62ba7296f2b92e97981b348f178b/gemma3_270m_q4_k_m_gguf_part2-1.0.0-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/2d/f6/d22123f2c0f8b61f75d61c39504c8a9a66052e448095b1e28a4610a96b88/gemma3_270m_q4_k_m_gguf_part3-1.0.0-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/84/32/aa8097ac001bc212833320cf328fd5462c8f4ba720528d0528329a3340a6/gemma3_270m_q4_k_m_gguf_part4-1.0.0-py3-none-any.whl",
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function wheelUrl(pkg, fallback) {
  try {
    const res = await fetch(`https://pypi.org/pypi/${pkg}/json`);
    const j = await res.json();
    const whl = (j.urls ?? []).find((u) => (u.filename ?? "").endsWith(".whl"));
    if (whl?.url) return whl.url;
  } catch {}
  return fallback;
}

/** Minimal ZIP reader: returns the (inflated) first entry whose name matches `re`. */
function extractEntry(zipPath, re) {
  const buf = readFileSync(zipPath);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${path.basename(zipPath)} is not a zip`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString("utf8");
    if (re.test(name)) {
      const lhNameLen = buf.readUInt16LE(localOff + 26);
      const lhExtraLen = buf.readUInt16LE(localOff + 28);
      const dataStart = localOff + 30 + lhNameLen + lhExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      return method === 8 ? inflateRawSync(data) : data;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`no entry matching ${re} in ${path.basename(zipPath)}`);
}

async function main() {
  console.log(`target: ${outPath}`);
  if (existsSync(outPath)) {
    const size = readFileSync(outPath).length;
    console.log(`model already present (${(size / 1e6).toFixed(1)} MB) — delete it to re-download.`);
    return;
  }
  await mkdir(path.dirname(outPath), { recursive: true });

  if (process.env.AI_MODEL_URL) {
    console.log(`downloading ${process.env.AI_MODEL_URL}`);
    await download(process.env.AI_MODEL_URL, outPath);
  } else {
    const tmp = path.join(root, ".data", "dl");
    await rm(tmp, { recursive: true, force: true });
    await mkdir(tmp, { recursive: true });
    const partBuffers = [];
    for (let i = 0; i < PART_PKGS.length; i++) {
      const pkg = PART_PKGS[i];
      const url = await wheelUrl(pkg, PINNED_PART_URLS[i]);
      const whl = path.join(tmp, `${pkg}.whl`);
      process.stdout.write(`[${i + 1}/4] ${pkg} … `);
      await download(url, whl);
      const part = extractEntry(whl, /\.part\d+$/);
      console.log(`${(part.length / 1e6).toFixed(1)} MB`);
      partBuffers.push(part);
    }
    console.log("assembling GGUF …");
    writeFileSync(outPath, Buffer.concat(partBuffers));
    await rm(tmp, { recursive: true, force: true });
  }

  const fd = openSync(outPath, "r");
  const magic = Buffer.alloc(4);
  let done = 0;
  while (done < 4) done += readSync(fd, magic, done, 4 - done, null);
  closeSync(fd);
  if (magic.toString("latin1") !== "GGUF")
    throw new Error("downloaded file is not a valid GGUF (bad magic bytes)");
  console.log(`ok — ${outPath} (${(readFileSync(outPath).length / 1e6).toFixed(1)} MB)`);
  console.log("Next: npm run ai:warmup");
}

await main();
