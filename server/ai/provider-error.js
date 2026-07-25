export class AiProviderError extends Error {
  constructor(reason, message, options = {}) {
    super(message, options);
    this.name = "AiProviderError";
    this.reason = reason;
  }
}

export function failure(reason, meta) {
  return {
    ok: false,
    reason,
    ...(meta ? { meta } : {})
  };
}
