import { appendFileSync } from 'node:fs';
import { NimClient } from './nim-client.js';
import { runBenchmark, formatMarkdownTable, type BenchmarkResult } from './bench.js';

function envOrDefault(key: string, def: string): string {
  return process.env[key] || def;
}

function splitCSV(s: string): string[] {
  return s.split(',').map(item => item.trim()).filter(item => item !== '');
}

const SYNTHETIC_REVIEW_PROMPT = `You are reviewing a code change. Analyze the following diff for bugs, security issues, and performance problems. Respond in concise markdown with findings.

\`\`\`diff
func processOrder(items []Item, discount float64) Order {
    total := 0.0
    for _, item := range items {
        total += item.Price * float64(item.Quantity)
    }
    total = total * (1 - discount)
    tax := total * 0.08
    return Order{
        Items: items,
        Subtotal: total,
        Tax: tax,
        Total: total + tax,
    }
}
\`\`\``;

async function probe(baseURL: string, apiKey: string, models: string[]): Promise<void> {
  const client = new NimClient(baseURL, apiKey);

  for (const model of models) {
    process.stderr.write(`  ${model} ...`);
    const ok = await client.probeModel(model);
    if (ok) {
      process.stderr.write(' ok\n');
      console.log(`${model} ok`);
    } else {
      process.stderr.write(' FAIL\n');
      console.log(`${model} FAIL`);
    }
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) {
    throw new Error('NIM_API_KEY is required');
  }

  const baseURL = envOrDefault('NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1');
  const models = splitCSV(envOrDefault('NIM_MODELS',
    'meta/llama-3.3-70b-instruct,deepseek-ai/deepseek-v4-pro,nvidia/llama-3.1-nemotron-70b-instruct,mistralai/mistral-large-3-675b-instruct-2512,qwen/qwen3.5-397b-a17b,minimaxai/minimax-m3,z-ai/glm-5.2'));

  // --probe mode
  if (process.argv.includes('--probe')) {
    await probe(baseURL, apiKey, models);
    return;
  }

  let iterations = 5;
  const iterEnv = process.env.NIM_BENCH_ITERATIONS;
  if (iterEnv) {
    const n = parseInt(iterEnv, 10);
    if (isNaN(n)) throw new Error('NIM_BENCH_ITERATIONS must be an integer');
    iterations = n;
  }

  const benchPrompt = envOrDefault('NIM_BENCH_PROMPT', SYNTHETIC_REVIEW_PROMPT);
  const client = new NimClient(baseURL, apiKey);

  process.stderr.write(`Benchmarking ${models.length} models with ${iterations} iterations each...\n\n`);

  const results: BenchmarkResult[] = [];
  for (const model of models) {
    process.stderr.write(`  ${model} ...`);
    const start = Date.now();

    const result = await runBenchmark(client, model, {
      prompt: benchPrompt,
      iterations,
      temperature: 0.2,
      maxTokens: 1024,
    });

    const elapsed = Date.now() - start;
    const errCount = result.iterations.filter(it => it.error !== null).length;
    process.stderr.write(` done in ${Math.round(elapsed / 1000)}s (${errCount} errors)\n`);

    results.push(result);
  }

  const table = formatMarkdownTable(results);
  console.log(table);

  // Write to GITHUB_STEP_SUMMARY if set
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      appendFileSync(summaryPath, `\n## NIM Model Benchmark\n\n${table}\n`);
    } catch (err) {
      process.stderr.write(`Warning: could not open GITHUB_STEP_SUMMARY: ${err}\n`);
    }
  }
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
