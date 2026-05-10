#!/usr/bin/env node

// -----------------------------
// CONFIG
// -----------------------------

const GROQ_API_KEY = "yyy"
const DEEPINFRA_API_KEY = "xxx"

const RUNS = Number(process.argv[2] ?? 5)

const PROVIDERS = [
   {
      name: "groq:gpt-oss-20b",
      apiKey: GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: "openai/gpt-oss-20b",
      reasoningEffort: "low",
   },
   {
      name: "deepinfra:gpt-oss-20b",
      apiKey: DEEPINFRA_API_KEY,
      url: "https://api.deepinfra.com/v1/openai/chat/completions",
      model: "openai/gpt-oss-20b",
      reasoningEffort: "low",
   },
   {
      name: "deepinfra:gemma-4-26b-moe",
      apiKey: DEEPINFRA_API_KEY,
      url: "https://api.deepinfra.com/v1/openai/chat/completions",
      model: "google/gemma-4-26B-A4B-it",
   },
   {
      name: "deepinfra:gemma-4-31b",
      apiKey: DEEPINFRA_API_KEY,
      url: "https://api.deepinfra.com/v1/openai/chat/completions",
      model: "google/gemma-4-31B-it",
   },
   {
      name: "deepinfra:deepseek-v4-flash",
      apiKey: DEEPINFRA_API_KEY,
      url: "https://api.deepinfra.com/v1/openai/chat/completions",
      model: "deepseek-ai/DeepSeek-V4-Flash",
      reasoningEffort: "low",
   },
]

const PROMPT = `
Eres Lucas, asistente financiero por WhatsApp para usuarios venezolanos.

Reglas:
- Responde breve, en español venezolano.
- Si falta un dato obligatorio para pago móvil, pregunta antes de continuar.
- Para pagos, confirma monto en número y palabras.
- No pidas PIN hasta tener todos los datos.
- Cuando falte un dato, igual muestra los datos que sí entendiste.

Datos requeridos para pago móvil:
monto, teléfono, banco destino, cédula destino, concepto.

Formato ideal cuando falte un dato:
Me falta: [dato faltante]

Tengo:
💸 [monto en número] ([monto en palabras])
Para: [destinatario]
Banco: [banco]
Teléfono: [teléfono]
Concepto: [concepto]

Pásame [dato faltante] y te confirmo antes de pedir PIN.

Usuario:
Acabo de pagar 1.250 bolos a María González por Banesco, su número es 0414-1234567, era por el almuerzo de ayer
`.trim()

// -----------------------------
// HELPERS
// -----------------------------

function now() {
   return performance.now()
}

function fmt(n: number | null | undefined, d = 3) {
   if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "-"
   return Number(n).toFixed(d)
}

function nums(xs: Array<number | null | undefined>) {
   return xs.filter(
      (x): x is number => typeof x === "number" && Number.isFinite(x),
   )
}

function avg(xs: Array<number | null | undefined>) {
   const values = nums(xs)
   if (!values.length) return NaN
   return values.reduce((a, b) => a + b, 0) / values.length
}

function min(xs: Array<number | null | undefined>) {
   const values = nums(xs)
   if (!values.length) return NaN
   return Math.min(...values)
}

function max(xs: Array<number | null | undefined>) {
   const values = nums(xs)
   if (!values.length) return NaN
   return Math.max(...values)
}

function stats(xs: Array<number | null | undefined>) {
   return {
      avg: avg(xs),
      min: min(xs),
      max: max(xs),
   }
}

function extractDeltaText(json: any) {
   const delta = json.choices?.[0]?.delta

   if (!delta) return ""

   if (typeof delta.content === "string") {
      return delta.content
   }

   if (Array.isArray(delta.content)) {
      return delta.content
         .map((part: any) => {
            if (typeof part === "string") return part
            if (typeof part?.text === "string") return part.text
            return ""
         })
         .join("")
   }

   return ""
}

function compactResponse(text: string) {
   return text
      .trim()
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
}

// -----------------------------
// BENCHMARK
// -----------------------------

type Provider = {
   name: string
   apiKey: string
   url: string
   model: string
   reasoningEffort?: "low" | "medium" | "high"
}

async function runOnce(provider: Provider, runNumber: number) {
   const started = now()

   const body: any = {
      model: provider.model,
      messages: [{ role: "user", content: PROMPT }],
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0,
      max_tokens: 180,
   }

   if (provider.reasoningEffort) {
      body.reasoning_effort = provider.reasoningEffort
   }

   const res = await fetch(provider.url, {
      method: "POST",
      headers: {
         Authorization: `Bearer ${provider.apiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
   })

   if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`${provider.name} HTTP ${res.status}: ${errorText}`)
   }

   if (!res.body) {
      throw new Error(`${provider.name}: response body missing`)
   }

   const reader = res.body.getReader()
   const decoder = new TextDecoder()

   let buffer = ""
   let ttft: number | null = null
   let text = ""
   let usage: any = null

   while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const raw of lines) {
         const line = raw.trim()
         if (!line.startsWith("data:")) continue

         const data = line.slice("data:".length).trim()
         if (!data || data === "[DONE]") continue

         let json: any
         try {
            json = JSON.parse(data)
         } catch {
            continue
         }

         const deltaText = extractDeltaText(json)

         if (deltaText) {
            if (ttft === null) ttft = now() - started
            text += deltaText
         }

         if (json.usage) usage = json.usage
      }
   }

   const total = now() - started

   const outTokens =
      usage?.completion_tokens ??
      usage?.output_tokens ??
      usage?.completionTokens ??
      null

   const decodeSeconds =
      ttft == null ? null : Math.max((total - ttft) / 1000, 0.001)

   const decodeTps =
      outTokens == null || decodeSeconds == null
         ? null
         : outTokens / decodeSeconds

   const result = {
      provider: provider.name,
      model: provider.model,
      runNumber,
      ttftS: ttft == null ? null : ttft / 1000,
      totalS: total / 1000,
      outTokens,
      decodeTps,
      text: compactResponse(text),
      usage,
   }

   console.log(
      [
         runNumber,
         fmt(result.ttftS),
         fmt(result.totalS),
         outTokens ?? "-",
         fmt(decodeTps, 1),
      ].join("\t"),
   )

   console.log(`\n[${provider.name} run ${runNumber} output]`)
   console.log(result.text || "(empty)")
   console.log("")

   return result
}

function printStats(
   label: string,
   s: { avg: number; min: number; max: number },
   digits = 3,
) {
   console.log(
      [
         label,
         `avg ${fmt(s.avg, digits)}`,
         `min ${fmt(s.min, digits)}`,
         `max ${fmt(s.max, digits)}`,
      ].join("\t"),
   )
}

async function benchProvider(provider: Provider) {
   console.log(
      `\n=== ${provider.name} · ${provider.model} · ${RUNS} run(s) ===`,
   )
   console.log(["run", "ttft(s)", "total(s)", "out_toks", "dec_tps"].join("\t"))

   const results = []

   for (let i = 1; i <= RUNS; i++) {
      try {
         const result = await runOnce(provider, i)
         results.push(result)
      } catch (err: any) {
         console.log([i, "ERROR", "ERROR", "-", "-"].join("\t"))
         console.error(String(err?.message ?? err))
      }
   }

   if (!results.length) return null

   const summary = {
      provider: provider.name,
      model: provider.model,
      ttft: stats(results.map((r) => r.ttftS)),
      total: stats(results.map((r) => r.totalS)),
      outTokens: stats(results.map((r) => r.outTokens)),
      decodeTps: stats(results.map((r) => r.decodeTps)),
      responses: results.map((r) => r.text),
   }

   console.log(`\n--- ${provider.name} stats ---`)
   printStats("ttft(s)", summary.ttft)
   printStats("total(s)", summary.total)
   printStats("out_toks", summary.outTokens, 0)
   printStats("dec_tps", summary.decodeTps, 1)

   return summary
}

async function main() {
   console.log("Lucas LLM benchmark")
   console.log(`Runs per provider: ${RUNS}`)

   const summaries = []

   for (const provider of PROVIDERS) {
      if (!provider.apiKey || provider.apiKey.includes("PASTE_")) {
         console.log(`\nSkipping ${provider.name}: missing API key`)
         continue
      }

      const summary = await benchProvider(provider)
      if (summary) summaries.push(summary)
   }

   if (summaries.length) {
      console.log("\n=== final comparison, avg values ===")
      console.log(
         [
            "provider",
            "model",
            "ttft_avg",
            "total_avg",
            "out_avg",
            "tps_avg",
         ].join("\t"),
      )

      for (const s of summaries.sort((a, b) => a.total.avg - b.total.avg)) {
         console.log(
            [
               s.provider,
               s.model,
               fmt(s.ttft.avg),
               fmt(s.total.avg),
               fmt(s.outTokens.avg, 0),
               fmt(s.decodeTps.avg, 1),
            ].join("\t"),
         )
      }

      const fastest = summaries.reduce((best, s) =>
         s.total.avg < best.total.avg ? s : best,
      )

      console.log(
         `\nFastest avg total: ${fastest.provider} · ${fmt(fastest.total.avg)}s`,
      )
   }
}

main().catch((err) => {
   console.error(err)
   process.exit(1)
})
