// src/components/Vote.tsx
import { useState } from "react";
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const PK = (import.meta.env.VITE_DEV_PRIVATE_KEY || "").trim();

const MODULE_NAME = "voting";
const FN_VOTE = "vote";

// ---------- helpers (no Buffer) ----------
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Hex must be even-length (no 0x).");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}
function bcsSerializeU64(n: bigint | number | string): Uint8Array {
  const bn = typeof n === "bigint" ? n : BigInt(n);
  if (bn < 0n || bn > 0xffffffffffffffffn) throw new Error("u64 out of range");
  const out = new Uint8Array(8);
  let tmp = bn;
  for (let i = 0; i < 8; i++) {
    out[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  return out;
}
// address in Move is 32 bytes; left-pad with zeros if shorter
function bcsSerializeAddress(addr: string): Uint8Array {
  const clean = addr.trim().toLowerCase();
  const bytes = hexToBytes(clean.startsWith("0x") ? clean : `0x${clean}`);
  if (bytes.length > 32) throw new Error("Address longer than 32 bytes.");
  const out = new Uint8Array(32);
  out.set(bytes, 32 - bytes.length); // left-pad
  return out;
}
// ULEB128 for vector length
function uleb128(n: number): Uint8Array {
  if (n < 0) throw new Error("uleb128 expects non-negative");
  const out: number[] = [];
  do {
    let b = n & 0x7f;
    n >>= 7;
    if (n !== 0) b |= 0x80;
    out.push(b);
  } while (n !== 0);
  return new Uint8Array(out);
}
function bcsSerializeVectorU8(v: Uint8Array): Uint8Array {
  const len = uleb128(v.length);
  const out = new Uint8Array(len.length + v.length);
  out.set(len, 0);
  out.set(v, len.length);
  return out;
}
function parseChoicesToU8(text: string): Uint8Array {
  const nums = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > 255)
        throw new Error(`Bad choice: ${s}`);
      return n;
    });
  return new Uint8Array(nums);
}
// ----------------------------------------

export default function Vote() {
  const [ownerAddr, setOwnerAddr] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [choicesText, setChoicesText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<any>(null);

  async function handleVote() {
    try {
      setError(null);
      setLastTx(null);

      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!PK) throw new Error("VITE_DEV_PRIVATE_KEY is missing.");
      if (!ownerAddr.trim()) throw new Error("Owner address is required.");
      if (!proposalId.trim()) throw new Error("Proposal ID is required.");
      if (!choicesText.trim())
        throw new Error("Enter at least one choice index.");

      setSubmitting(true);

      const client = await SupraClient.init(RPC);
      const voter = new SupraAccount(hexToBytes(PK));
      const { sequence_number } = await client.getAccountInfo(voter.address());

      const argOwner = bcsSerializeAddress(ownerAddr.trim());
      const argPid = bcsSerializeU64(BigInt(proposalId.trim()));
      const choices = parseChoicesToU8(choicesText);
      const argChoices = bcsSerializeVectorU8(choices);

      const serialized = await client.createSerializedRawTxObject(
        voter.address(),
        sequence_number,
        MODULE_ADDR,
        MODULE_NAME,
        FN_VOTE,
        [], // type args
        [argOwner, argPid, argChoices]
      );

      const tx = await client.sendTxUsingSerializedRawTransaction(
        voter,
        serialized,
        {
          enableTransactionSimulation: true,
          enableWaitForTransaction: true,
        }
      );

      setLastTx(tx);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card__body">
      <label className="label">Owner address</label>
      <input
        className="input"
        placeholder="0x… (admin who created the proposal)"
        value={ownerAddr}
        onChange={(e) => setOwnerAddr(e.target.value)}
        spellCheck={false}
      />

      <label className="label">Proposal ID</label>
      <input
        className="input"
        placeholder="0"
        value={proposalId}
        onChange={(e) => setProposalId(e.target.value)}
        inputMode="numeric"
      />

      <label className="label">Choices (comma or space-separated)</label>
      <input
        className="input"
        placeholder="e.g. 1 or 0,2"
        value={choicesText}
        onChange={(e) => setChoicesText(e.target.value)}
      />

      <div className="actions">
        <button className="btn" onClick={handleVote} disabled={submitting}>
          {submitting ? "Submitting…" : "Vote"}
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {lastTx && (
        <div className="alert alert--ok">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Transaction submitted
          </div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(lastTx, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
