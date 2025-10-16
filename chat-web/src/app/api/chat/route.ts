import OpenAI from "openai";

type ChatCompletionRequestMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const FALLBACK_TEMPERATURE = 0.6;
const parsedEnvTemperature = Number(process.env.OPENAI_TEMPERATURE);
const DEFAULT_TEMPERATURE = Number.isFinite(parsedEnvTemperature)
  ? Math.min(Math.max(parsedEnvTemperature, 0), 2)
  : FALLBACK_TEMPERATURE;

export async function POST(request: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error: "Missing OPENAI_API_KEY environment variable.",
      },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON payload received." },
      { status: 400 }
    );
  }

  const { messages, model, temperature } = body as {
    messages?: ChatCompletionRequestMessage[];
    model?: string;
    temperature?: number;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "The request must include an array of messages." },
      { status: 400 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const safeMessages = messages.map((message) => ({
    role: message.role,
    content:
      typeof message.content === "string"
        ? message.content
        : String(message.content ?? ""),
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: model || DEFAULT_MODEL,
      messages: safeMessages,
      temperature:
        typeof temperature === "number"
          ? Math.min(Math.max(temperature, 0), 2)
          : DEFAULT_TEMPERATURE,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const token = chunk.choices?.[0]?.delta?.content ?? "";
            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return Response.json(
      {
        error:
          "Unable to generate a response. Please verify your API key and try again.",
      },
      { status: 500 }
    );
  }
}
