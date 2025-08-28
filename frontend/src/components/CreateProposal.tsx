import { useState } from "react";
import { SupraClient, SupraAccount, BCS } from "supra-l1-sdk";

// ---- ENV (Vite exposes only VITE_* keys) ----
const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const PK = (import.meta.env.VITE_DEV_PRIVATE_KEY || "").trim();

const MODULE_NAME = "voting";
const FN_CREATE = "create_proposal";

// ---- Helpers (no Buffer) ----
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("VITE_DEV_PRIVATE_KEY must be even-length hex (no 0x).");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}

// ULEB128 encode small non-negative ints (used for vector length)
function uleb128(n: number): Uint8Array {
  if (n < 0) throw new Error("uleb128 expects non-negative integer");
  const bytes: number[] = [];
  do {
    let b = n & 0x7f;
    n >>>= 7;
    if (n !== 0) b |= 0x80;
    bytes.push(b);
  } while (n !== 0);
  return Uint8Array.from(bytes);
}

// BCS vector<String> = uleb128(len) || concat(BCS(String_i))
function bcsSerializeVectorOfStrings(items: string[]): Uint8Array {
  const parts = items.map((s) => BCS.bcsSerializeStr(s));
  const prefix = uleb128(items.length);
  const total = prefix.length + parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  out.set(prefix, 0);
  let off = prefix.length;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export default function CreateProposal() {
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<any>(null);

  const addOption = () => setOptions((o) => [...o, ""]);
  const removeOption = (idx: number) =>
    setOptions((o) => o.filter((_, i) => i !== idx));
  const updateOption = (idx: number, val: string) =>
    setOptions((o) => o.map((v, i) => (i === idx ? val : v)));

  async function handleCreate() {
    try {
      setError(null);
      setLastTx(null);
      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!PK) throw new Error("VITE_DEV_PRIVATE_KEY is missing.");

      const q = question.trim();
      const trimmedOptions = options.map((s) => s.trim()).filter(Boolean);
      if (!q) throw new Error("Question is required.");
      if (trimmedOptions.length === 0)
        throw new Error("Add at least one option.");

      setSubmitting(true);

      const client = await SupraClient.init(RPC);
      const me = new SupraAccount(hexToBytes(PK));
      const { sequence_number } = await client.getAccountInfo(me.address());

      // Args: String, vector<String>
      const argQuestion = BCS.bcsSerializeStr(q);
      const argOptions = bcsSerializeVectorOfStrings(trimmedOptions);

      const serialized = await client.createSerializedRawTxObject(
        me.address(),
        sequence_number,
        MODULE_ADDR,
        MODULE_NAME,
        FN_CREATE,
        [], // type args
        [argQuestion, argOptions] // BCS-encoded args
      );

      const tx = await client.sendTxUsingSerializedRawTransaction(
        me,
        serialized,
        {
          enableTransactionSimulation: true,
          enableWaitForTransaction: true,
        }
      );

      setLastTx(tx);
      // small UX touch
      setQuestion("");
      setOptions(["", ""]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      style={{
        marginTop: "1.5rem",
        maxWidth: 720,
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      }}
    >
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
        Question
      </label>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What’s the color?"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #D0D5DD",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        Options
      </label>
      {options.map((opt, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={i === 0 ? "Blue" : i === 1 ? "Red" : "New option"}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #D0D5DD",
              outline: "none",
            }}
          />
          <button
            onClick={() => removeOption(i)}
            aria-label="Remove option"
            style={{
              width: 42,
              borderRadius: 8,
              border: "1px solid #D0D5DD",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        style={{
          display: "inline-block",
          marginTop: 4,
          marginBottom: 14,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px dashed #D0D5DD",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        + Add option
      </button>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={handleCreate}
          disabled={submitting}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #175CD3",
            background: submitting ? "#B2DDFF" : "#2E90FA",
            color: "#fff",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Create Proposal"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#FEF3F2",
            color: "#B42318",
            border: "1px solid #FDA29B",
          }}
        >
          {error}
        </div>
      )}

      {lastTx && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#ECFDF3",
            color: "#027A48",
            border: "1px solid #A6F4C5",
            wordBreak: "break-word",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Transaction submitted
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(lastTx, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
