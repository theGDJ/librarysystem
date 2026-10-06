"use client";

import { useEffect, useId, useRef, useState } from "react";
import { extractMarks, normaliseIsCode, type MarkType } from "@/lib/verify/extract";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

type ScanCandidate = { type: MarkType; value: string; confidence: number };
type RegistryRow = {
  markNo: string; type: string; holder: string; product: string; standardCode: string | null;
  status: string; issuedOn: string; validTill: string; city: string;
};
type ScanResponse = {
  verdict: "VALID_IN_REGISTRY" | "SUSPENDED" | "EXPIRED" | "NOT_FOUND" | "NO_MARK_DETECTED";
  matches: RegistryRow[];
  checks: { formatValid: boolean; foundInRegistry: boolean; statusActive: boolean; withinValidity: boolean; standardConsistent: boolean };
};

const TYPE_LABEL: Record<MarkType, string> = {
  isi: "ISI licence", crs: "CRS registration", jeweller: "Jeweller registration", huid: "HUID",
};
const STATUS_CLASS: Record<string, string> = { valid: "tag-ok", suspended: "tag-qco", expired: "tag-danger" };

function prepareImage(image: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const gray = pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114;
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
    pixels.data[i] = contrast;
    pixels.data[i + 1] = contrast;
    pixels.data[i + 2] = contrast;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

export function ScanMark() {
  const { locale } = useLocale();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [isCode, setIsCode] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function clearPreview() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPreview(null);
  }

  async function readFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(tx(locale, "Choose an image file."));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMessage(tx(locale, "Choose an image smaller than 15 MB."));
      return;
    }
    clearPreview();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
    setCandidates([]);
    setIsCode("");
    setMessage("");
    setResult(null);
    setConfidence(null);
    setProgress(0);
    setReading(true);
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | null = null;
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = prepareImage(image);
      // Loaded only when the user opens the scanner and chooses an image.
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng+hin", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
        langPath: "/tesseract/tessdata",
        workerBlobURL: false,
        gzip: true,
        logger: (event) => {
          if (event.status === "recognizing text") setProgress(Math.round(event.progress * 100));
        },
      });
      const { data } = await worker.recognize(canvas);
      const extracted = extractMarks(data.text).map((candidate) => ({
        type: candidate.type, value: candidate.normalised, confidence: candidate.confidence,
      }));
      setCandidates(extracted);
      setIsCode(normaliseIsCode(data.text) ?? "");
      setConfidence(data.confidence);
      if (!extracted.length)
        setMessage(tx(locale, "No mark number detected. Try good light, hold steady, and fill the frame with the mark—or type the number above."));
      else if (data.confidence < 45)
        setMessage(tx(locale, "The photo may be blurry or the reading uncertain. Check each detected digit before verifying."));
    } catch {
      setMessage(typeof navigator !== "undefined" && !navigator.onLine
        ? tx(locale, "OCR could not load while offline. Reconnect once to load the local OCR engine, or type the number above.")
        : tx(locale, "OCR could not be loaded or the image could not be read. Try again or type the number above."));
    } finally {
      await worker?.terminate().catch(() => undefined);
      setReading(false);
    }
  }

  async function verify() {
    const submitted = candidates.map((candidate) => candidate.value.trim().toUpperCase()).filter(Boolean);
    setVerifying(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/verify/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: submitted, ...(isCode.trim() ? { isCode: isCode.trim() } : {}) }),
      });
      if (!response.ok) throw new Error("Registry request failed.");
      setResult((await response.json()) as ScanResponse);
    } catch {
      setMessage(typeof navigator !== "undefined" && !navigator.onLine
        ? tx(locale, "You appear to be offline. Reconnect and try registry verification again.")
        : tx(locale, "The registry could not be reached. Try again in a moment."));
    } finally {
      setVerifying(false);
    }
  }

  const verdictCopy: Record<ScanResponse["verdict"], string> = {
    VALID_IN_REGISTRY: "Found in the registry",
    SUSPENDED: "Found in the registry — suspended",
    EXPIRED: "Found in the registry — expired",
    NOT_FOUND: "Not found in the registry",
    NO_MARK_DETECTED: "No mark detected",
  };

  return (
    <div className="mt-5 border-t border-rule pt-5">
      <button type="button" className="btn btn-secondary" aria-expanded={open} aria-controls={id + "-scan"}
        onClick={() => { setOpen((value) => !value); setMessage(""); }}>
        {open ? tx(locale, "Close label scanner") : tx(locale, "Scan label")}
      </button>
      {open && (
        <div id={id + "-scan"} className="mt-4 space-y-4">
          <p className="text-sm text-muted">{tx(locale, "The photo stays in your browser. Only the identifiers you choose to verify are sent to the demo registry.")}</p>
          <input ref={inputRef} id={id + "-file"} className="sr-only" type="file" accept="image/*" capture="environment"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void readFile(file);
              event.currentTarget.value = "";
            }}
            aria-label={tx(locale, "Choose or photograph a product label")} />
          {!preview && (
            <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void readFile(file);
              }}>
              {tx(locale, "Choose photo or drop it here")}
            </button>
          )}
          {preview && (
            <div className="space-y-3">
              {/* The object URL is local to this browser and is never sent to an API. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={tx(locale, "Preview of the label photo")} className="max-h-64 rounded-md border border-rule object-contain" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()}>
                {tx(locale, "Retake or choose another")}
              </button>
            </div>
          )}
          {reading && (
            <div className="space-y-2" aria-live="polite">
              <p className="text-sm text-muted">{tx(locale, "Reading label…")} {progress}%</p>
              <progress className="w-full" value={progress} max={100} aria-label={tx(locale, "OCR progress")} />
            </div>
          )}
          {!!candidates.length && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">{tx(locale, "Check the detected identifiers")}</p>
              {candidates.map((candidate, index) => (
                <div key={candidate.type + "-" + index}>
                  <label htmlFor={id + "-candidate-" + index} className="label">{tx(locale, TYPE_LABEL[candidate.type])}</label>
                  <input id={id + "-candidate-" + index} className="field id mt-1 w-full" value={candidate.value}
                    autoCapitalize="characters" spellCheck={false}
                    onChange={(event) => setCandidates((all) => all.map((item, i) =>
                      i === index ? { ...item, value: event.target.value } : item,
                    ))} />
                </div>
              ))}
              {confidence !== null && confidence < 65 &&
                <p className="text-sm text-muted">{tx(locale, "Low-confidence reading—please verify the digits carefully.")}</p>}
              {isCode && (
                <div>
                  <label htmlFor={id + "-iscode"} className="label">{tx(locale, "Detected IS code (optional)")}</label>
                  <input id={id + "-iscode"} className="field id mt-1 w-full" value={isCode} onChange={(event) => setIsCode(event.target.value)} />
                </div>
              )}
              <button type="button" className="btn btn-primary" onClick={() => void verify()} disabled={verifying || reading}>
                {verifying ? tx(locale, "Verifying…") : tx(locale, "Verify identifiers")}
              </button>
            </div>
          )}
          {message && <p className="text-sm text-attention-ink" role="status">{message}</p>}
          {result && (
            <div ref={resultRef} tabIndex={-1} className="sheet space-y-4 px-5 py-4 outline-none" aria-live="polite" aria-label={tx(locale, "Scan verification result")}>
              <div>
                <p className="font-semibold text-ink">{tx(locale, verdictCopy[result.verdict])}</p>
                <p className="mt-1 text-sm text-muted">{tx(locale, "The registry is a demonstration dataset, not official BIS confirmation.")}</p>
              </div>
              {result.matches.map((record) => (
                <div key={record.markNo} className="border-t border-rule pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={"tag " + (STATUS_CLASS[record.status] ?? "")}>{tx(locale, record.status)}</span>
                    <span className="id">{record.markNo}</span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{record.holder}</p>
                  <p className="text-sm text-body">{record.product}</p>
                  <dl className="mt-3 grid grid-cols-[100px_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted">{tx(locale, "Standard")}</dt><dd className="id">{record.standardCode ?? tx(locale, "Not recorded")}</dd>
                    <dt className="text-muted">{tx(locale, "Valid until")}</dt><dd>{record.validTill}</dd>
                    <dt className="text-muted">{tx(locale, "Location")}</dt><dd>{record.city}</dd>
                  </dl>
                  <p className="mt-2 text-sm text-muted">{tx(locale, "Compare the holder and product with what you bought; a copied real number can also appear on a counterfeit label.")}</p>
                </div>
              ))}
              <ul className="space-y-1 border-t border-rule pt-3 text-sm">
                {([
                  ["formatValid", "Mark format is valid"],
                  ["foundInRegistry", "Found in the registry"],
                  ["statusActive", "Registry status is active"],
                  ["withinValidity", "Within the printed validity dates"],
                  ["standardConsistent", "Standard matches the label"],
                ] as const).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span aria-hidden="true">{result.checks[key] ? "✓" : "—"}</span><span>{tx(locale, label)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">{tx(locale, "For official confirmation, use the BIS Care App or contact BIS on helpline 1915.")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
