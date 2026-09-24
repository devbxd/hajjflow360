import { callGemini, textOf, GEMINI_MODELS, type GeminiContent, type GeminiPart } from './gemini';

// Tool-calling conversation loops for Manasik AI. Groq is the main AI (generous free tier:
// ~1,000 requests and 200K tokens a day per model); Gemini is the fallback when every Groq
// model is out of quota.

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ConverseJob {
  system: string;
  history: ChatTurn[];
  declarations: { name: string; description: string; parameters?: unknown }[];
  execute: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export type ConverseResult = { ok: true; reply: string } | { ok: false; status: number; error: string; exhausted?: boolean };

const MAX_TOOL_ROUNDS = 6;

// Tool results are the bulk of every request; capping them keeps each call inside the free
// tiers' per-minute token budgets (Groq: 8K tokens/minute per model).
const MAX_TOOL_OUTPUT_CHARS = 9000;
function fitForModel(output: unknown) {
  const json = JSON.stringify(output) ?? 'null';
  return json.length <= MAX_TOOL_OUTPUT_CHARS ? json : `${json.slice(0, MAX_TOOL_OUTPUT_CHARS)}… [truncated — ask for fewer records or add filters]`;
}

/* ─── Gemini ─── */

export async function converseGemini({ system, history, declarations, execute }: ConverseJob): Promise<ConverseResult> {
  const contents: GeminiContent[] = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  let models = GEMINI_MODELS;
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const result = await callGemini(
      {
        systemInstruction: { parts: [{ text: system }] },
        contents,
        // On the last round, withhold the tools so the model has to answer with what it has.
        tools: round < MAX_TOOL_ROUNDS ? [{ functionDeclarations: declarations }] : undefined,
        generationConfig: { temperature: 0.5 },
      },
      models
    );
    if (!result.ok) return { ok: false, status: result.status, error: result.error };
    // Stay on the same model for follow-up rounds: its function-call signatures are model-specific.
    models = [result.model];
    const calls = result.content.parts.filter((p) => p.functionCall);
    if (!calls.length) return { ok: true, reply: textOf(result.content) };
    // Echo the model turn back unchanged (it carries thought signatures), then answer every call.
    contents.push(result.content);
    const parts: GeminiPart[] = [];
    for (const { functionCall } of calls) {
      const { name, args = {} } = functionCall!;
      const output = await execute(name, args);
      const text = fitForModel(output);
      parts.push({ functionResponse: { name, response: { result: text.length <= MAX_TOOL_OUTPUT_CHARS ? output : text } } });
    }
    contents.push({ role: 'user', parts });
  }
  return { ok: false, status: 502, error: 'The question needed too many steps. Try asking something more specific.' };
}

/* ─── Groq (OpenAI-compatible) ─── */

// Each model has its own free quota, so when one runs out the conversation continues on the next.
export const GROQ_MODELS = [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'].filter(
  (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i
);

interface GroqToolCall {
  id: string;
  type?: 'function';
  function: { name: string; arguments?: string };
}
interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
}
type GroqCall = { ok: true; message: GroqMessage } | { ok: false; next: boolean; status: number; error: string };

// Gemini-style declarations use upper-case types; OpenAI-style APIs expect JSON Schema.
function toJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toJsonSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) out[k] = k === 'type' && typeof v === 'string' ? v.toLowerCase() : toJsonSchema(v);
  return out;
}

async function callGroq(model: string, messages: GroqMessage[], tools?: unknown[]): Promise<GroqCall> {
  const send = () =>
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model, messages, ...(tools ? { tools, tool_choice: 'auto' } : {}), temperature: 0.5 }),
    }).catch(() => null);
  let res = await send();
  // The per-minute token budget refills within seconds: if Groq says the wait is short,
  // wait once rather than burning through the other models.
  const retryAfter = res?.status === 429 ? parseFloat(res.headers.get('retry-after') ?? '') : NaN;
  if (retryAfter > 0 && retryAfter <= 12) {
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + 250));
    res = await send();
  }
  if (!res) return { ok: false, next: true, status: 502, error: 'Could not reach the AI service.' };
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    // Quota (429), request too large for the per-minute budget (413), retired model (404), an
    // outage, or an unparsable tool call (random, usually fine on the next model): move on.
    const malformed = res.status === 400 && (err.code === 'tool_use_failed' || 'failed_generation' in err || /pars/i.test(err.message ?? ''));
    const next = [404, 413, 429].includes(res.status) || res.status >= 500 || malformed;
    const error =
      res.status === 429
        ? 'The free AI quota is used up for now. Wait a minute and try again.'
        : malformed
          ? 'The AI got confused by this question. Please rephrase it.'
          : err.message ?? `AI error ${res.status}`;
    return { ok: false, next, status: res.status === 429 ? 429 : 502, error };
  }
  const message = data?.choices?.[0]?.message as GroqMessage | undefined;
  if (!message) return { ok: false, next: true, status: 502, error: 'The AI returned an empty answer.' };
  return { ok: true, message };
}

export async function converseGroq({ system, history, declarations, execute }: ConverseJob): Promise<ConverseResult> {
  const tools = declarations.map((d) => ({
    type: 'function',
    function: { name: d.name, description: d.description, parameters: d.parameters ? toJsonSchema(d.parameters) : { type: 'object', properties: {} } },
  }));
  const messages: GroqMessage[] = [{ role: 'system', content: system }, ...history.map((m) => ({ role: m.role, content: m.text }))];
  let modelIndex = 0;
  let last: GroqCall = { ok: false, next: true, status: 502, error: 'The AI did not answer.' };

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    let result: GroqCall | null = null;
    while (modelIndex < GROQ_MODELS.length) {
      result = await callGroq(GROQ_MODELS[modelIndex], messages, round < MAX_TOOL_ROUNDS ? tools : undefined);
      if (result.ok || !result.next) break;
      last = result;
      modelIndex++;
    }
    if (!result || !result.ok) {
      const failed = (result ?? last) as Extract<GroqCall, { ok: false }>;
      return { ok: false, status: failed.status, error: failed.error, exhausted: modelIndex >= GROQ_MODELS.length };
    }
    const calls = result.message.tool_calls ?? [];
    if (!calls.length) return { ok: true, reply: (result.message.content ?? '').trim() };
    messages.push({
      role: 'assistant',
      content: result.message.content ?? '',
      tool_calls: calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.function.name, arguments: c.function.arguments || '{}' } })),
    });
    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}') ?? {};
      } catch {
        // The tool reports missing arguments itself.
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: fitForModel(await execute(call.function.name, args)) });
    }
  }
  return { ok: false, status: 502, error: 'The question needed too many steps. Try asking something more specific.' };
}

/* ─── Entry point ─── */

// Groq first; Gemini only if every Groq model is out of quota (or Groq isn't configured).
// onRestart lets the caller discard side effects of an abandoned run before Gemini starts over.
export async function converse(job: ConverseJob, onRestart?: () => void): Promise<ConverseResult> {
  let result: ConverseResult | null = process.env.GROQ_API_KEY ? await converseGroq(job) : null;
  if ((!result || (!result.ok && result.exhausted)) && process.env.GEMINI_API_KEY) {
    onRestart?.();
    result = await converseGemini(job);
  }
  return result ?? { ok: false, status: 503, error: 'No AI key is configured on the server (GROQ_API_KEY).' };
}
