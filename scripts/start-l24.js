const providerArgument = process.argv.find((argument) =>
  argument.startsWith("--provider=")
);
const provider = providerArgument?.split("=", 2)[1] || "replay";
const supportedProviders = new Set(["replay", "mistral", "opencode"]);

if (!supportedProviders.has(provider)) {
  console.error(`Provider non supportato: ${provider}`);
  process.exit(1);
}

process.env.AI_PROVIDER = provider;
console.log(`L24 provider: ${provider}`);
await import("../server/index.js");
