/* Embedded AI model runtime.
 *
 * PRAMAAN's assistant is powered by a language model that runs *inside this*
 * server process — no cloud API, no external calls, no keys. The model is a
 * GGUF file executed with llama.cpp (via node-llama-cpp).
 *
 * Default weights: Gemma 3 270M (Q4_K_M, ~241 MB) assembled from the PyPI
 * "gemma3-270m-q4-k-m-gguf-part{1..4}" chunk packages by
 * `npm run model:download`. Any other GGUF (e.g. Qwen2.5-0.5B-Instruct,
 * SmolLM2, Llama-3.2-1B) can be dropped in via AI_GGUF_PATH / AI_MODEL_URL —
 * instruct-tuned models will produce noticeably richer replies.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

export const MODEL_NAME = "gemma-3-270m";

const DEFAULT_MODEL_FILE = path.join(
  process.cwd(),
  ".data",
  "models",
  "gemma-3-270m-q4_k_m.gguf",
);

export function modelPath(): string {
  return process.env.AI_GGUF_PATH ?? DEFAULT_MODEL_FILE;
}

export function isModelAvailable(): boolean {
  return existsSync(modelPath());
}

function contextSize(): number {
  const n = Number(process.env.AI_CONTEXT_SIZE ?? 4096);
  return Number.isFinite(n) && n >= 1024 ? n : 4096;
}

function threads(): number {
  const n = Number(process.env.AI_THREADS ?? 0);
  if (Number.isFinite(n) && n > 0) return n;
  return Math.max(1, Math.min(4, os.cpus().length || 2));
}

/* node-llama-cpp is heavy and native — imported lazily on first use so that
 * `next build` / page rendering never touches it. */
type Llama = Awaited<
  ReturnType<(typeof import("node-llama-cpp"))["getLlama"]>
>;
type Model = Awaited<ReturnType<Llama["loadModel"]>>;

let modelPromise: Promise<Model> | null = null;

async function loadModel(): Promise<Model> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const { getLlama } = await import("node-llama-cpp");
      const llama = await getLlama({ skipDownload: true });
      return llama.loadModel({ modelPath: modelPath() });
    })();
    modelPromise.catch(() => {
      // allow retry on next call if the first load failed
      modelPromise = null;
    });
  }
  return modelPromise;
}

export type GenerateOptions = {
  /** maximum tokens to generate (default AI_MAX_TOKENS || 220) */
  maxTokens?: number;
  temperature?: number;
  /** strings that, when generated, stop generation */
  stop?: string[];
};

/**
 * Runs a single raw-completion pass against a fresh context, then disposes the
 * context. The model itself stays resident in memory.
 */
export async function generateRaw(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<string> {
  const model = await loadModel();
  const [{ LlamaCompletion }] = await Promise.all([import("node-llama-cpp")]);
  const context = await model.createContext({
    contextSize: contextSize(),
    threads: threads(),
  });
  try {
    const completion = new LlamaCompletion({
      contextSequence: context.getSequence(),
    });
    const out = await completion.generateCompletion(prompt, {
      maxTokens: opts.maxTokens ?? Number(process.env.AI_MAX_TOKENS ?? 220),
      temperature: opts.temperature ?? 0.25,
      topP: 0.9,
      repeatPenalty: {
        penalty: 1.25,
        presencePenalty: 0.4,
        frequencyPenalty: 0.15,
        lastTokens: 96,
      },
      customStopTriggers: opts.stop ?? [],
    });
    return out ?? "";
  } finally {
    await context.dispose().catch(() => {});
  }
}

/** Eagerly load the model (used by `npm run ai:warmup`). */
export async function warmup(): Promise<void> {
  if (!isModelAvailable())
    throw new Error(
      `GGUF model not found at ${modelPath()}. Run \`npm run model:download\` first.`,
    );
  await loadModel();
  await generateRaw("Question: ready?\nAnswer: yes", { maxTokens: 4 });
}

/**
 * Output-quality guard for a small embedded model: removes prompt echoes,
 * stops at the first repeated line, caps bullet count, and reports whether the
 * remaining prose looks usable.
 */
export function sanitiseCompletion(raw: string): { text: string; usable: boolean } {
  const PROMPT_MARKERS = [
    "TASK:", "FACTS:", "EXAMPLE", "END OF", "Question:", "Answer:", "RULES:",
    "Context:", "INSTRUCTIONS", "END OF EXAMPLE", "Solutions:",
  ];
  const seen = new Set<string>();
  const kept: string[] = [];
  let bullets = 0;
  for (const ln of raw.split("\n")) {
    const t = ln.trim();
    // stop cleanly at structural bleed-through
    if (PROMPT_MARKERS.some((m) => t.startsWith(m))) break;
    const key = t.toLowerCase().replace(/\W+/g, " ").trim();
    if (key && seen.has(key)) break; // first verbatim repeat -> loop detected
    if (key) seen.add(key);
    if (t.startsWith("- ")) {
      bullets++;
      if (bullets > 5) break;
    }
    kept.push(ln);
  }
  let text = kept.join("\n");
  // trim dangling markdown from a truncated bullet
  const opens = (text.match(/\*\*/g) ?? []).length;
  if (opens % 2 === 1) text = text.replace(/\*\*([^*]*)$/, "$1");
  text = text.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const usable =
    wordCount >= 8 &&
    !/(.)\1{9,}/.test(text) &&
    // rejects fact-line regurgitation ("[2] IS … Key clauses … About: …")
    !/\[\d+\]/.test(text) &&
    !/Key clauses|About:/.test(text) &&
    // rejects the model turning interviewer and firing questions back
    (text.match(/\?/g) ?? []).length <= 1;
  return { text, usable };
}
