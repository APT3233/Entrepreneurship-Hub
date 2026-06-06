let parseSseChatCompletion;

beforeAll(async () => {
  ({ parseSseChatCompletion } = await import("../aiStreamParser.js"));
});

async function* streamFrom(chunks) {
  for (const chunk of chunks) yield chunk;
}

describe("parseSseChatCompletion", () => {
  it("joins streamed chat completion chunks and handles DONE", async () => {
    const tokens = [];
    const text = await parseSseChatCompletion(streamFrom([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      "data: [DONE]\n\n",
    ]), (token) => tokens.push(token));

    expect(text).toBe("Hello world");
    expect(tokens).toEqual(["Hello", " world"]);
  });

  it("rejects malformed JSON chunks", async () => {
    await expect(parseSseChatCompletion(streamFrom([
      "data: {not-json}\n\n",
      "data: [DONE]\n\n",
    ]))).rejects.toMatchObject({ aiCode: "ai_stream_parse_failed" });
  });

  it("rejects streams that end without DONE", async () => {
    await expect(parseSseChatCompletion(streamFrom([
      'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
    ]))).rejects.toMatchObject({ aiCode: "ai_stream_parse_failed" });
  });

  it("rejects empty streams", async () => {
    await expect(parseSseChatCompletion(streamFrom(["data: [DONE]\n\n"]))).rejects.toMatchObject({
      aiCode: "ai_empty_response",
    });
  });
});
