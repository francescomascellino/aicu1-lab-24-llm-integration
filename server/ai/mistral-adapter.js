import { AiProviderError } from "./provider-error.js";

const DEFAULT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

export function createMistralAdapter({
  apiKey = process.env.MISTRAL_API_KEY,
  model = process.env.MISTRAL_MODEL || "mistral-small-latest",
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = 10_000,
  fetchImpl = fetch
} = {}) {
  return {
    name: "mistral",
    async generate({ systemPrompt, input }) {
      if (!apiKey) {
        throw new AiProviderError(
          "configuration_error",
          "MISTRAL_API_KEY non configurata."
        );
      }

      const startedAt = performance.now();

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(input) }
            ]
          }),
          signal: AbortSignal.timeout(timeoutMs)
        });

        if (response.status === 401 || response.status === 403) {
          throw new AiProviderError(
            "configuration_error",
            `Mistral ha rifiutato la configurazione (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new AiProviderError(
            "provider_unavailable",
            `Mistral non disponibile (${response.status}).`
          );
        }

        const body = await response.json();
        const choice = body.choices?.[0];
        const content = choice?.message?.content;
        const meta = {
          provider: "mistral",
          model,
          durationMs: Math.round(performance.now() - startedAt)
        };

        if (typeof content !== "string" || content.length === 0) {
          return {
            content: null,
            refusal: "Il provider non ha restituito contenuto utilizzabile.",
            meta
          };
        }

        return { content, meta };
      } catch (error) {
        if (error instanceof AiProviderError) {
          throw error;
        }

        if (error?.name === "TimeoutError" || error?.name === "AbortError") {
          throw new AiProviderError(
            "timeout",
            "La chiamata al provider ha superato il tempo massimo.",
            { cause: error }
          );
        }

        throw new AiProviderError(
          "provider_unavailable",
          "La chiamata al provider non e' riuscita.",
          { cause: error }
        );
      }
    }
  };
}
