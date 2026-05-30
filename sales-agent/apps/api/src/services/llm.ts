export type LLMProvider = "anthropic" | "openai" | "local";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function complete(
  messages: LLMMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.7;

  if (process.env.ANTHROPIC_API_KEY) {
    return completeAnthropic(messages, maxTokens, temperature);
  }
  if (process.env.OPENAI_API_KEY) {
    return completeOpenAI(messages, maxTokens, temperature);
  }
  if (process.env.LOCAL_LLM_URL) {
    return completeOpenAI(messages, maxTokens, temperature, true);
  }

  throw new Error(
    "No LLM configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or LOCAL_LLM_URL."
  );
}

async function completeAnthropic(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system,
      messages: userMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

async function completeOpenAI(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number,
  local = false
): Promise<string> {
  const baseUrl = local
    ? (process.env.LOCAL_LLM_URL ?? "http://localhost:11434/v1")
    : "https://api.openai.com/v1";
  const model = local
    ? (process.env.LOCAL_LLM_MODEL ?? "llama3.2")
    : "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(local ? {} : { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }),
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI-compatible API error: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}
