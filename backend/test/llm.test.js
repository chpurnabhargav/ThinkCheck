const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveConfig, extractJSON, createLLM, LLMError } = require('../lib/llm');

test('resolveConfig auto-detects the provider from the configured key', () => {
  assert.equal(resolveConfig({ GEMINI_API_KEY: 'g' }).provider, 'gemini');
  assert.equal(resolveConfig({ GROQ_API_KEY: 'gsk_1' }).provider, 'groq');
  assert.equal(resolveConfig({ XAI_API_KEY: 'xai-1' }).provider, 'xai');
  assert.equal(resolveConfig({ OPENAI_API_KEY: 'sk-1' }).provider, 'openai');
});

test('resolveConfig routes a Groq key stored in GROK_API_KEY to Groq', () => {
  const groq = resolveConfig({ GROK_API_KEY: 'gsk_abc' });
  assert.equal(groq.provider, 'groq');
  assert.equal(groq.apiKey, 'gsk_abc');
  assert.equal(groq.baseUrl, 'https://api.groq.com/openai/v1');

  const xai = resolveConfig({ GROK_API_KEY: 'xai-abc' });
  assert.equal(xai.provider, 'xai');
  assert.equal(xai.apiKey, 'xai-abc');
});

test('resolveConfig honours explicit overrides', () => {
  const config = resolveConfig({
    LLM_PROVIDER: 'openai',
    LLM_BASE_URL: 'http://localhost:11434/v1/',
    LLM_MODEL: 'llama3.1',
  });
  assert.equal(config.baseUrl, 'http://localhost:11434/v1');
  assert.equal(config.model, 'llama3.1');
  assert.equal(config.requiresKey, false);
  assert.throws(() => resolveConfig({ LLM_PROVIDER: 'nope' }), /Unknown LLM_PROVIDER/);
});

test('extractJSON handles fences and surrounding prose', () => {
  assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Sure! Here it is:\n{"a":[1,2]}\nHope that helps.'), { a: [1, 2] });
  assert.throws(() => extractJSON('no json here'));
  assert.throws(() => extractJSON(''));
});

function fakeFetch(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    const next = responses.shift();
    return { ok: next.status === 200, status: next.status, json: async () => next.body };
  };
  return { fetchImpl, calls };
}

const openAIReply = (content, finish_reason = 'stop') => ({
  status: 200,
  body: { choices: [{ message: { content }, finish_reason }] },
});

test('OpenAI-compatible calls request JSON mode and send the bearer token', async () => {
  const { fetchImpl, calls } = fakeFetch([openAIReply('{"ok":true}')]);
  const llm = createLLM(resolveConfig({ GROQ_API_KEY: 'gsk_x' }), { fetchImpl });

  const result = await llm.generateJSON({ system: 's', prompt: 'p' });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls[0].url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(calls[0].headers.Authorization, 'Bearer gsk_x');
  assert.deepEqual(calls[0].body.response_format, { type: 'json_object' });
});

test('Gemini calls use the native API with JSON mime type', async () => {
  const { fetchImpl, calls } = fakeFetch([
    { status: 200, body: { candidates: [{ content: { parts: [{ text: '{"n":2}' }] }, finishReason: 'STOP' }] } },
  ]);
  const llm = createLLM(resolveConfig({ GEMINI_API_KEY: 'g-key' }), { fetchImpl });

  assert.deepEqual(await llm.generateJSON({ system: 's', prompt: 'p' }), { n: 2 });
  assert.match(calls[0].url, /models\/gemini-[^:]+:generateContent$/);
  assert.equal(calls[0].headers['x-goog-api-key'], 'g-key');
  assert.equal(calls[0].body.generationConfig.responseMimeType, 'application/json');
});

test('generateJSON retries once when the model returns malformed output', async () => {
  const { fetchImpl, calls } = fakeFetch([openAIReply('not json'), openAIReply('{"fixed":true}')]);
  const llm = createLLM(resolveConfig({ OPENAI_API_KEY: 'k' }), { fetchImpl });

  assert.deepEqual(await llm.generateJSON({ system: 's', prompt: 'p' }), { fixed: true });
  assert.equal(calls.length, 2);
});

test('a retired model produces an actionable error and is not retried', async () => {
  const { fetchImpl, calls } = fakeFetch([{ status: 404, body: { error: { message: 'not found' } } }]);
  const llm = createLLM(resolveConfig({ GEMINI_API_KEY: 'g', LLM_MODEL: 'gemini-1.5-pro' }), { fetchImpl });

  await assert.rejects(llm.generateText({ system: 's', prompt: 'p' }), (err) => {
    assert.ok(err instanceof LLMError);
    assert.match(err.message, /gemini-1\.5-pro.*LLM_MODEL/s);
    return true;
  });
  assert.equal(calls.length, 1);
});

test('missing API key fails fast without calling the provider', async () => {
  const { fetchImpl, calls } = fakeFetch([]);
  const llm = createLLM(resolveConfig({}), { fetchImpl });
  await assert.rejects(llm.generateText({ system: 's', prompt: 'p' }), /GEMINI_API_KEY/);
  assert.equal(calls.length, 0);
});
