export type GeminiConfig = {
  baseUrl: string;
  apiKeys: string[];
};

export type GeminiRequestOptions = {
  path: string;
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "DELETE";
};

export type GeminiSuccessResponse = {
  response: Response;
  usedApiKey: string;
};

export class GeminiError extends Error {
  constructor(message: string, public readonly causeKey?: string) {
    super(message);
    this.name = "GeminiError";
  }
}

function sanitizeBaseUrl(baseUrl: string): string {
  if (!baseUrl.endsWith("/")) {
    return `${baseUrl}/`;
  }
  return baseUrl;
}

export async function requestGeminiWithFailover(
  config: GeminiConfig,
  options: GeminiRequestOptions
): Promise<GeminiSuccessResponse> {
  const baseUrl = sanitizeBaseUrl(config.baseUrl);
  const apiKeys = config.apiKeys.map((key) => key.trim()).filter(Boolean);

  if (!apiKeys.length) {
    throw new GeminiError("No API keys provided");
  }

  let lastError: unknown;

  for (const key of apiKeys) {
    try {
      const response = await fetch(`${baseUrl}${options.path.replace(/^\//, "")}`, {
        method: options.method ?? (options.body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        lastError = new GeminiError(
          `Request failed with status ${response.status}`,
          key
        );
        continue;
      }

      return { response, usedApiKey: key };
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  if (lastError instanceof GeminiError) {
    throw lastError;
  }

  throw new GeminiError("All Gemini API keys failed");
}
