import { toolSpecByName, toolSpecs } from "../mcp/tools";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolEvent {
  name: string;
  args: Record<string, unknown>;
  result: string;
}

export interface AgentResult {
  reply: string;
  toolEvents: ToolEvent[];
  mode: "live" | "demo";
}

const SYSTEM_PROMPT = `You are Synapse, an assistant with persistent long-term memory exposed via tools.
Rules:
- Before answering anything that depends on the user's history, preferences, or past statements, FIRST call "recall" to retrieve relevant memories.
- Whenever the user shares a durable fact, preference, decision, or detail about themselves, call "remember" to store it.
- Be concise and warm. When you used a recalled memory, make that obvious in your answer.`;

/* ------------------------------- Live mode ---------------------------- */

async function runLive(
  messages: ChatMessage[],
  apiKey: string,
): Promise<AgentResult> {
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

  const tools = toolSpecs.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.jsonSchema,
    },
  }));

  const convo: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  const toolEvents: ToolEvent[] = [];

  for (let step = 0; step < 6; step++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: convo, tools, temperature: 0.3 }),
    });
    if (!res.ok) {
      throw new Error(`LLM error ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as {
      choices: { message: Record<string, unknown> }[];
    };
    const msg = json.choices[0].message;
    convo.push(msg);

    const toolCalls = msg.tool_calls as
      | { id: string; function: { name: string; arguments: string } }[]
      | undefined;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        reply: (msg.content as string) ?? "",
        toolEvents,
        mode: "live",
      };
    }

    for (const call of toolCalls) {
      const spec = toolSpecByName.get(call.function.name);
      let resultText = `Unknown tool: ${call.function.name}`;
      let args: Record<string, unknown> = {};
      if (spec) {
        try {
          args = JSON.parse(call.function.arguments || "{}");
          const parsed = spec.schema.safeParse(args);
          if (parsed.success) {
            const out = await spec.handler(parsed.data as Record<string, unknown>);
            resultText = out.text;
          } else {
            resultText = `Invalid arguments: ${parsed.error.message}`;
          }
        } catch (e) {
          resultText = `Error: ${String(e)}`;
        }
      }
      toolEvents.push({ name: call.function.name, args, result: resultText });
      convo.push({
        role: "tool",
        tool_call_id: call.id,
        content: resultText,
      });
    }
  }

  return {
    reply: "I gathered the relevant memories but reached the reasoning limit.",
    toolEvents,
    mode: "live",
  };
}

/* ------------------------------- Demo mode ---------------------------- */

const STORE_PATTERNS: RegExp[] = [
  /^remember(?: that)?\s+(.+)/i,
  /^note(?: that)?\s+(.+)/i,
  /^save(?: this)?:?\s+(.+)/i,
  /^(my name is\s+.+)/i,
  /^(i (?:am|'m)\s+.+)/i,
  /^(i (?:like|love|prefer|enjoy|hate|dislike)\s+.+)/i,
  /^(i (?:live|work|study)\s+.+)/i,
  /^(i have\s+.+)/i,
  /^(my\s+\w+\s+is\s+.+)/i,
];

function detectMemory(text: string): string | null {
  const trimmed = text.trim();
  for (const re of STORE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) return (m[1] ?? trimmed).trim().replace(/[.!]+$/, "");
  }
  return null;
}

function isQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.endsWith("?") ||
    /^(what|who|where|when|why|how|do|did|does|is|are|can|could|tell me|remind)/.test(
      t,
    )
  );
}

async function runDemo(messages: ChatMessage[]): Promise<AgentResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser?.content?.trim() ?? "";
  const toolEvents: ToolEvent[] = [];

  if (!text) {
    return { reply: "Tell me something to remember, or ask me what I know.", toolEvents, mode: "demo" };
  }

  const toRemember = detectMemory(text);

  if (toRemember && !isQuestion(text)) {
    const remember = toolSpecByName.get("remember")!;
    const out = await remember.handler({ content: toRemember, source: "playground" });
    toolEvents.push({
      name: "remember",
      args: { content: toRemember, source: "playground" },
      result: out.text,
    });
    return {
      reply: `Got it. I'll remember that ${toRemember}. You can ask me about this in any future session and I'll recall it.`,
      toolEvents,
      mode: "demo",
    };
  }

  // Otherwise, recall relevant memories and answer from them.
  const recall = toolSpecByName.get("recall")!;
  const out = await recall.handler({ query: text, limit: 5 });
  const hits = (out.data?.hits ?? []) as {
    content: string;
    score: number;
  }[];
  toolEvents.push({ name: "recall", args: { query: text, limit: 5 }, result: out.text });

  const strong = hits.filter((h) => h.score > 0.25);
  if (strong.length === 0) {
    return {
      reply:
        "I do not have a memory related to that yet. Tell me a fact (for example, \"I prefer dark mode\") and I will remember it for next time.",
      toolEvents,
      mode: "demo",
    };
  }

  const top = strong.slice(0, 3).map((h) => `- ${h.content}`).join("\n");
  return {
    reply: `Based on what I remember about you:\n${top}\n\n(These were retrieved semantically from your memory store via the recall tool.)`,
    toolEvents,
    mode: "demo",
  };
}

/* ------------------------------- Entry -------------------------------- */

export async function runAgent(
  messages: ChatMessage[],
  overrideKey?: string,
): Promise<AgentResult> {
  const key = (overrideKey || process.env.OPENAI_API_KEY || "").trim();
  if (key) {
    try {
      return await runLive(messages, key);
    } catch (e) {
      // Fall back to demo mode but surface the reason.
      const demo = await runDemo(messages);
      demo.reply = `Live model unavailable (${String(e)}). Falling back to demo mode.\n\n${demo.reply}`;
      return demo;
    }
  }
  return runDemo(messages);
}
