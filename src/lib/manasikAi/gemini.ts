// Minimal Google Gemini REST client shared by the Manasik IA routes.
// Uses fetch directly so there is no SDK dependency to keep up to date.

// Tried in order; a 404 (model retired or not enabled for the key) falls through to the next one.
export const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'].filter(
  (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i
);

export interface GeminiPart {
  text?: string;
  thought?: boolean;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  [key: string]: unknown;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export type GeminiResult =
  | { ok: true; model: string; content: GeminiContent }
  | { ok: false; status: number; error: string };

export async function callGemini(body: Record<string, unknown>, models: string[] = GEMINI_MODELS): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, status: 503, error: 'GEMINI_API_KEY is not configured on the server.' };

  let last: GeminiResult = { ok: false, status: 502, error: 'The AI did not answer.' };
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    }).catch(() => null);

    if (!res) {
      last = { ok: false, status: 502, error: 'Could not reach Google Gemini.' };
      continue;
    }
    if (res.status === 404) {
      last = { ok: false, status: 502, error: `Gemini model "${model}" is not available.` };
      continue;
    }
    if (res.status === 429) {
      return { ok: false, status: 429, error: 'The free Gemini quota is used up for now. Wait a minute (or until tomorrow) and try again.' };
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      return { ok: false, status: 502, error: detail?.error?.message ?? `Gemini error ${res.status}` };
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content as GeminiContent | undefined;
    if (!content?.parts?.length) {
      const reason = data?.promptFeedback?.blockReason ?? data?.candidates?.[0]?.finishReason;
      return { ok: false, status: 502, error: reason ? `The AI declined to answer (${reason}).` : 'The AI returned an empty answer.' };
    }
    return { ok: true, model, content: { role: 'model', parts: content.parts } };
  }
  return last;
}

export function textOf(content: GeminiContent) {
  return content.parts
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();
}
