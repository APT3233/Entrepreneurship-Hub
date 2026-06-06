import { createAiError, AiErrorCodes } from "app/core/ai/aiErrors.js";
import { createRequire } from "node:module";

const requireNodeBuiltin = createRequire(import.meta.url);

const MAX_FILE_BYTES = Number(process.env.AI_EXTRACT_MAX_FILE_BYTES || 30 * 1024 * 1024);
const SUPPORTED_TYPES = new Set(["pdf", "docx", "txt", "text", "pptx"]);
const SOURCE_ATTACHMENT_EXTERNAL = "external_or_unreadable_attachment";

const streamToBuffer = async (input) => {
  if (Buffer.isBuffer(input)) return input;
  const chunks = [];
  for await (const chunk of input) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const extensionOf = (file) => {
  const raw = String(file.file_type || file.file_name?.split(".").pop() || "").toLowerCase().replace(/^\./, "");
  if (raw === "text/plain") return "txt";
  return raw;
};

const fileNameFromPath = (value) => {
  const name = String(value || "").split("/").pop() || "attachment";
  return decodeURIComponent(name.split("?")[0]).replace(/^\d+_/, "") || "attachment";
};

const parseAttachmentValues = (raw) => {
  if (raw == null || raw === "") return [];
  const text = String(raw).trim();
  if (!text) return [];
  if (!text.startsWith("[")) return [text];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [text];
  } catch {
    return [text];
  }
};

const attachmentToFile = (value, index) => {
  const raw = typeof value === "object" && value !== null
    ? value.objectKey || value.file_path || value.path || value.url || value.fileUrl || ""
    : String(value || "");
  const text = String(raw).trim();
  if (!text) return null;

  let filePath = "";
  let fileName = typeof value === "object" && value !== null
    ? value.fileName || value.file_name || value.name || ""
    : "";

  try {
    const url = new URL(text, "http://localhost");
    const pathParam = url.searchParams.get("path");
    const nameParam = url.searchParams.get("name");
    if (pathParam) {
      filePath = pathParam;
      fileName = fileName || nameParam || fileNameFromPath(pathParam);
    } else if (url.protocol === "http:" || url.protocol === "https:") {
      const bucket = process.env.MINIO_BUCKET || "ehub";
      const parts = url.pathname.split("/").filter(Boolean);
      const bucketIndex = parts.indexOf(bucket);
      if (bucketIndex >= 0 && parts.length > bucketIndex + 1) {
        filePath = parts.slice(bucketIndex + 1).join("/");
        fileName = fileName || fileNameFromPath(filePath);
      }
    }
  } catch {
    // fall through to object-key handling
  }

  if (!filePath && !/^https?:\/\//i.test(text)) {
    filePath = text.replace(/^\/+/, "");
    fileName = fileName || fileNameFromPath(filePath);
  }

  if (!filePath) {
    return {
      ok: false,
      id: index + 1,
      file_name: fileName || fileNameFromPath(text),
      code: SOURCE_ATTACHMENT_EXTERNAL,
      message: "Lecturer attachment is an external URL or does not expose an internal storage path.",
    };
  }

  return {
    ok: true,
    id: index + 1,
    file_name: fileName || fileNameFromPath(filePath),
    file_path: filePath,
    file_type: fileNameFromPath(fileName || filePath).split(".").pop(),
    file_size: value?.size || value?.file_size || null,
  };
};

export const normalizeExtractedText = (text) => String(text || "")
  .replace(/\u0000/g, " ")
  .replace(/[\t ]+/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

export const truncateForAi = (text, maxChars) => {
  const normalized = normalizeExtractedText(text);
  if (!maxChars || normalized.length <= maxChars) return { text: normalized, truncated: false };
  return { text: normalized.slice(0, maxChars), truncated: true };
};

const extractPdf = async (buffer) => {
  if (typeof process.getBuiltinModule !== "function") {
    process.getBuiltinModule = (name) => (name === "module" ? { createRequire } : requireNodeBuiltin(`node:${name}`));
  }

  if (!globalThis.DOMMatrix || !globalThis.ImageData || !globalThis.Path2D) {
    const canvas = await import("@napi-rs/canvas");
    globalThis.DOMMatrix ??= canvas.DOMMatrix;
    globalThis.ImageData ??= canvas.ImageData;
    globalThis.Path2D ??= canvas.Path2D;
  }

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy?.();
  }
};

const extractDocx = async (buffer) => {
  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer });
  return parsed.value || "";
};

const extractPptx = async (buffer) => {
  const mod = await import("officeparser");
  const parser = mod.default || mod;
  const parseOffice = parser.parseOffice || mod.parseOffice || mod.OfficeParser?.parseOffice;
  if (typeof parseOffice !== "function") throw new Error("officeparser_parse_unavailable");
  const ast = await parseOffice(buffer, { fileType: "pptx" });
  if (typeof ast?.toText === "function") return ast.toText();
  return Array.isArray(ast?.content) ? ast.content.map((node) => node.text || "").join("\n") : "";
};

export const extractTextFromFile = async (file, storageService) => {
  const ext = extensionOf(file);
  if (!SUPPORTED_TYPES.has(ext)) {
    return { ok: false, code: AiErrorCodes.UNSUPPORTED_FILE_TYPE, message: `Unsupported file type: ${ext || "unknown"}` };
  }
  if (Number(file.file_size || 0) > MAX_FILE_BYTES) {
    return { ok: false, code: AiErrorCodes.FILE_TOO_LARGE, message: "File is too large for AI extraction." };
  }

  try {
    const stream = await storageService.getStream(file.file_path);
    if (!stream) return { ok: false, code: AiErrorCodes.FILE_NOT_FOUND, message: "File not found in storage." };
    const buffer = await streamToBuffer(stream);
    let text = "";
    if (ext === "txt" || ext === "text") text = buffer.toString("utf8");
    if (ext === "pdf") text = await extractPdf(buffer);
    if (ext === "docx") text = await extractDocx(buffer);
    if (ext === "pptx") text = await extractPptx(buffer);
    const normalized = normalizeExtractedText(text);
    if (!normalized) return { ok: false, code: AiErrorCodes.EXTRACTION_FAILED, message: "No readable text found in file." };
    return { ok: true, text: normalized };
  } catch (err) {
    return {
      ok: false,
      code: AiErrorCodes.EXTRACTION_FAILED,
      message: String(err?.message || err).slice(0, 300),
    };
  }
};

export const extractSubmissionText = async ({ files, storageService, maxChars }) => {
  if (!files?.length) {
    throw createAiError(AiErrorCodes.FILE_NOT_FOUND, "Submission has no files for AI analysis.", 400);
  }

  const extractedFiles = [];
  const errors = [];
  for (const file of files) {
    const result = await extractTextFromFile(file, storageService);
    if (result.ok) {
      extractedFiles.push({
        id: Number(file.id),
        file_name: file.file_name,
        file_type: extensionOf(file),
        text: result.text,
      });
    } else {
      errors.push({
        id: Number(file.id),
        file_name: file.file_name,
        code: result.code,
        message: result.message,
      });
    }
  }

  if (!extractedFiles.length) {
    const code = errors.every((item) => item.code === AiErrorCodes.UNSUPPORTED_FILE_TYPE)
      ? AiErrorCodes.UNSUPPORTED_FILE_TYPE
      : errors.every((item) => item.code === AiErrorCodes.FILE_TOO_LARGE)
        ? AiErrorCodes.FILE_TOO_LARGE
        : errors.some((item) => item.code === AiErrorCodes.FILE_NOT_FOUND)
          ? AiErrorCodes.FILE_NOT_FOUND
          : AiErrorCodes.EXTRACTION_FAILED;
    throw createAiError(code, "No readable submission file could be extracted.", 400, { files: errors });
  }

  const combined = extractedFiles.map((file) => `# File: ${file.file_name}\n${file.text}`).join("\n\n");
  const truncated = truncateForAi(combined, maxChars);
  return {
    text: truncated.text,
    truncated: truncated.truncated,
    files: extractedFiles.map(({ text: _text, ...file }) => file),
    errors,
  };
};

export const extractSourceAttachmentText = async ({ attachmentUrl, storageService, maxChars }) => {
  const attachments = parseAttachmentValues(attachmentUrl).map(attachmentToFile).filter(Boolean);
  if (!attachments.length) {
    return { text: "", truncated: false, files: [], errors: [] };
  }

  const extractedFiles = [];
  const errors = [];
  for (const attachment of attachments) {
    if (!attachment.ok) {
      errors.push({
        id: Number(attachment.id),
        file_name: attachment.file_name,
        code: attachment.code,
        message: attachment.message,
      });
      continue;
    }

    const result = await extractTextFromFile(attachment, storageService);
    if (result.ok) {
      extractedFiles.push({
        id: Number(attachment.id),
        file_name: attachment.file_name,
        file_type: extensionOf(attachment),
        text: result.text,
      });
    } else {
      errors.push({
        id: Number(attachment.id),
        file_name: attachment.file_name,
        code: result.code,
        message: result.message,
      });
    }
  }

  const combined = extractedFiles.map((file) => `# Lecturer Attachment: ${file.file_name}\n${file.text}`).join("\n\n");
  const truncated = truncateForAi(combined, maxChars);
  return {
    text: truncated.text,
    truncated: truncated.truncated,
    files: extractedFiles.map(({ text: _text, ...file }) => file),
    errors,
  };
};
