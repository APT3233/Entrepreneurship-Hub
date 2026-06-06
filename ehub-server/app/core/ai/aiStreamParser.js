import { createAiError, AiErrorCodes } from "./aiErrors.js";

const parseJsonDataLine = (line) => {
  const data = line.replace(/^data:\s*/, "").trim();
  if (!data || data === "[DONE]") return { done: data === "[DONE]", content: "" };
  try {
    const json = JSON.parse(data);
    const content = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
    return { done: false, content: String(content || "") };
  } catch {
    throw createAiError(AiErrorCodes.MALFORMED_STREAM, "AI stream returned malformed JSON chunks.");
  }
};

export const parseSseChatCompletion = async (body, onToken = null) => {
  if (!body) throw createAiError(AiErrorCodes.EMPTY_RESPONSE, "AI provider returned an empty stream.");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let sawDone = false;

  for await (const chunk of body) {
    buffer += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim() || !line.startsWith("data:")) continue;
      const parsed = parseJsonDataLine(line);
      if (parsed.done) {
        sawDone = true;
        continue;
      }
      if (parsed.content) {
        fullText += parsed.content;
        if (typeof onToken === "function") onToken(parsed.content);
      }
    }
  }

  const tail = buffer.trim();
  if (tail.startsWith("data:")) {
    const parsed = parseJsonDataLine(tail);
    if (parsed.done) sawDone = true;
    if (parsed.content) fullText += parsed.content;
  }

  if (!fullText.trim()) {
    throw createAiError(AiErrorCodes.EMPTY_RESPONSE, "AI provider returned no content.");
  }
  if (!sawDone) {
    throw createAiError(AiErrorCodes.MALFORMED_STREAM, "AI stream ended before completion marker.");
  }
  return fullText;
};
