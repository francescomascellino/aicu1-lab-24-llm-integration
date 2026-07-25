import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { AiProviderError } from "./provider-error.js";

const execFileAsync = promisify(execFile);

export function createOpenCodeAdapter({
  command = "opencode",
  model = process.env.OPENCODE_MODEL,
  timeoutMs = 30_000,
  execImpl = execFileAsync
} = {}) {
  return {
    name: "opencode",
    async generate({ systemPrompt, input }) {
      const args = ["run"];

      if (model) {
        args.push("--model", model);
      }

      args.push(
        `${systemPrompt}\n\nINPUT JSON:\n${JSON.stringify(input)}\n\nRestituisci esclusivamente il JSON richiesto.`
      );

      const startedAt = performance.now();

      try {
        const { stdout } = await execImpl(command, args, {
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
          windowsHide: true
        });
        const content = stripMarkdownFence(stdout.trim());

        return {
          content,
          meta: {
            provider: "opencode",
            model: model || "configured-default",
            durationMs: Math.round(performance.now() - startedAt)
          }
        };
      } catch (error) {
        if (error?.killed || error?.code === "ETIMEDOUT") {
          throw new AiProviderError("timeout", "OpenCode ha superato il tempo massimo.");
        }

        if (error?.code === "ENOENT") {
          throw new AiProviderError(
            "configuration_error",
            "Comando opencode non disponibile."
          );
        }

        throw new AiProviderError(
          "provider_unavailable",
          "OpenCode non ha restituito un output utilizzabile."
        );
      }
    }
  };
}

function stripMarkdownFence(value) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

