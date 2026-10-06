/* Pre-loads the embedded AI model so the first chat request isn't slow.
 * Run:  npm run ai:warmup
 */
import { warmup, modelPath, isModelAvailable, MODEL_NAME } from "../src/lib/assistant/llm";

async function main() {
  if (!isModelAvailable()) {
    console.error(`Model not found at ${modelPath()}. Run \`npm run model:download\` first.`);
    process.exit(1);
  }
  const t0 = Date.now();
  await warmup();
  console.log(`embedded model "${MODEL_NAME}" ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
