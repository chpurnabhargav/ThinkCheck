// Provider-agnostic LLM client.
//
// Supports Google Gemini (native REST API) and any OpenAI-compatible
// chat-completions API (Groq, xAI Grok, OpenAI, Ollama, LM Studio, ...).
// Switching providers is a matter of environment variables; no code changes.

const PROVIDERS = {
  gemini: {
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    keyEnv: ['GEMINI_API_KEY'],
  },
  groq: {
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    keyEnv: ['GROQ_API_KEY'],
  },
  xai: {
    kind: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-3-mini',
    keyEnv: ['XAI_API_KEY', 'GROK_API_KEY'],
  },
  openai: {
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    keyEnv: ['OPENAI_API_KEY'],
  },
};

class LLMError extends Error {
  constructor(message, { status = 502, retryable = false } = {}) {
    super(message);
    this.name = 'LLMError';
    this.status = status;
    this.retryable = retryable;
  }
}

function detectProvider(env) {
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.GROQ_API_KEY) return 'groq';
  if (env.XAI_API_KEY) return 'xai';
  // "Grok" (xAI) and "Groq" are easy to mix up. Groq keys start with "gsk_".
  if (env.GROK_API_KEY) return env.GROK_API_KEY.startsWith('gsk_') ? 'groq' : 'xai';
  if (env.OPENAI_API_KEY) return 'openai';
  return 'gemini';
}

function resolveConfig(env = process.env) {
  const provider = (env.LLM_PROVIDER || '').trim().toLowerCase() || detectProvider(env);
  const preset = PROVIDERS[provider];
  if (!preset) {
    throw new Error(
      `Unknown LLM_PROVIDER "${provider}". Use one of: ${Object.keys(PROVIDERS).join(', ')}`
    );
  }

  let apiKey = env.LLM_API_KEY || preset.keyEnv.map((name) => env[name]).find(Boolean);
  if (!apiKey && provider === 'groq' && env.GROK_API_KEY?.startsWith('gsk_')) {
    apiKey = env.GROK_API_KEY;
  }

  return {
    provider,
    kind: preset.kind,
    baseUrl: (env.LLM_BASE_URL || preset.baseUrl).replace(/\/+$/, ''),
    model: env.LLM_MODEL || preset.model,
    apiKey: apiKey || '',
    // A custom base URL (e.g. a local Ollama server) may not need a key.
    requiresKey: !env.LLM_BASE_URL,
    keyEnvName: env.LLM_API_KEY ? 'LLM_API_KEY' : preset.keyEnv[0],
    timeoutMs: Number(env.LLM_TIMEOUT_MS) || 45000,
  };
}

// Models sometimes wrap JSON in ```json fences or add a sentence before it.
function extractJSON(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response');
  }
  const unfenced = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.search(/[[{]/);
    const end = Math.max(unfenced.lastIndexOf('}'), unfenced.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1));
    }
    throw new Error('Response was not valid JSON');
  }
}

function errorFromResponse(config, status, body) {
  const detail =
    body?.error?.message || (typeof body?.error === 'string' ? body.error : '') || '';
  const name = `${config.provider} (${config.model})`;

  if (status === 401 || status === 403 || /api key/i.test(detail)) {
    return new LLMError(`${name} rejected the API key. Check ${config.keyEnvName}.`);
  }
  if (status === 404) {
    return new LLMError(
      `Model "${config.model}" was not found on ${config.provider}. ` +
        'It may have been retired: set LLM_MODEL to a current model.'
    );
  }
  if (status === 429) {
    return new LLMError('The AI provider is rate limiting requests. Please try again shortly.', {
      status: 429,
      retryable: true,
    });
  }
  if (status >= 500) {
    return new LLMError(`${name} is temporarily unavailable (HTTP ${status}).`, {
      retryable: true,
    });
  }
  return new LLMError(`${name} returned HTTP ${status}${detail ? `: ${detail}` : ''}`);
}

function createLLM(config, { fetchImpl = globalThis.fetch } = {}) {
  async function post(url, headers, body) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new LLMError('The AI provider took too long to respond.', {
          status: 504,
          retryable: true,
        });
      }
      throw new LLMError(`Could not reach ${config.provider}: ${err.message}`, {
        retryable: true,
      });
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) throw errorFromResponse(config, res.status, data);
    return data;
  }

  async function callGemini({ system, prompt, temperature, json }) {
    const url = `${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`;
    const data = await post(
      url,
      { 'x-goog-api-key': config.apiKey },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // No maxOutputTokens: on "thinking" models the reasoning tokens count
        // towards that limit and can silently truncate the visible answer.
        generationConfig: {
          temperature,
          ...(json && { responseMimeType: 'application/json' }),
        },
      }
    );

    if (data?.promptFeedback?.blockReason) {
      throw new LLMError(`The request was blocked by the provider (${data.promptFeedback.blockReason}).`, {
        status: 400,
      });
    }
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || [])
      .filter((part) => !part.thought)
      .map((part) => part.text || '')
      .join('');
    return { text, truncated: candidate?.finishReason === 'MAX_TOKENS' };
  }

  async function callOpenAICompatible({ system, prompt, temperature, json }) {
    const headers = config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {};
    const data = await post(`${config.baseUrl}/chat/completions`, headers, {
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature,
      ...(json && { response_format: { type: 'json_object' } }),
    });
    const choice = data?.choices?.[0];
    return { text: choice?.message?.content || '', truncated: choice?.finish_reason === 'length' };
  }

  async function complete(options) {
    if (config.requiresKey && !config.apiKey) {
      throw new LLMError(`No API key configured. Set ${config.keyEnvName} in backend/.env.`, {
        status: 500,
      });
    }
    const call = config.kind === 'gemini' ? callGemini : callOpenAICompatible;
    const started = Date.now();
    const result = await call(options);
    console.log(`[llm] ${config.provider}/${config.model} ${Date.now() - started}ms`);

    if (result.truncated) {
      throw new LLMError('The AI response was cut off. Try asking for fewer items.', {
        retryable: true,
      });
    }
    if (!result.text.trim()) {
      throw new LLMError('The AI provider returned an empty response.', { retryable: true });
    }
    return result.text;
  }

  // Retries once on transient failures (timeouts, 5xx, 429, malformed output).
  async function withRetry(fn, retries = 1) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt >= retries || !err.retryable) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return {
    config,

    generateText({ system, prompt, temperature = 0.4 }) {
      return withRetry(() => complete({ system, prompt, temperature, json: false }));
    },

    // `validate` converts the raw parsed JSON into the shape the API returns,
    // and throws if the model's output is unusable (which triggers a retry).
    generateJSON({ system, prompt, temperature = 0.3, validate = (value) => value }) {
      return withRetry(async () => {
        const text = await complete({ system, prompt, temperature, json: true });
        try {
          return validate(extractJSON(text));
        } catch (err) {
          throw new LLMError(`The AI returned malformed data (${err.message}).`, {
            retryable: true,
          });
        }
      });
    },
  };
}

module.exports = { PROVIDERS, LLMError, resolveConfig, extractJSON, createLLM };
