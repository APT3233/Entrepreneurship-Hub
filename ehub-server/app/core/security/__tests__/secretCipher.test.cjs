let canEncryptSecrets;
let decryptSecret;
let encryptSecret;

beforeAll(async () => {
  ({ canEncryptSecrets, decryptSecret, encryptSecret } = await import("../secretCipher.js"));
});

describe("secretCipher", () => {
  it("encrypts and decrypts secrets without returning plaintext payloads", () => {
    const encrypted = encryptSecret("cmd-secret-value", "test-master-key");

    expect(encrypted).toMatch(/^v1:/);
    expect(encrypted).not.toContain("cmd-secret-value");
    expect(decryptSecret(encrypted, "test-master-key")).toBe("cmd-secret-value");
  });

  it("rejects missing master keys", () => {
    expect(canEncryptSecrets("")).toBe(false);
    expect(() => encryptSecret("cmd-secret-value", "")).toThrow("missing_secret_encryption_key");
  });

  it("rejects decryption with the wrong master key", () => {
    const encrypted = encryptSecret("cmd-secret-value", "test-master-key");

    expect(() => decryptSecret(encrypted, "wrong-master-key")).toThrow();
  });
});
