import assert from "node:assert/strict";
import test from "node:test";

import { createMistralAdapter } from "../../server/ai/mistral-adapter.js";

test("sends only the explicit input and requests JSON output", async () => {
  const calls = [];
  const adapter = createMistralAdapter({
    apiKey: "fake-key-for-local-test",
    model: "test-model",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: '{"topic":"ricerca"}' },
              finish_reason: "stop"
            }
          ]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }
  });

  const result = await adapter.generate({
    systemPrompt: "Restituisci JSON.",
    input: { feedback: ["Caso A"] }
  });
  const requestBody = JSON.parse(calls[0].options.body);

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://api.mistral.ai/v1/chat/completions"
  );
  assert.deepEqual(requestBody.response_format, { type: "json_object" });
  assert.equal(
    requestBody.messages[1].content,
    '{"feedback":["Caso A"]}'
  );
  assert.equal(result.content, '{"topic":"ricerca"}');
  assert.equal(result.meta.provider, "mistral");
});

test("fails explicitly when the API key is missing", async () => {
  const adapter = createMistralAdapter({ apiKey: "" });

  await assert.rejects(
    adapter.generate({ systemPrompt: "JSON", input: {} }),
    (error) => error.reason === "configuration_error"
  );
});
