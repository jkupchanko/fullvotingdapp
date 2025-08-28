// src/components/CloseProposal.tsx
import { useState } from "react";
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const PK = (import.meta.env.VITE_DEV_PRIVATE_KEY || "").trim();

const MODULE_NAME = "voting";
const FN_CLOSE = "close_proposal";

// --- helpers (no Buffer) ---
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Dev private key must be even-length hex (no 0x).");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
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

export default function CloseProposal() {
  const [proposalId, setProposalId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<any>(null);

  async function handleClose() {
    try {
      setError(null);
      setLastTx(null);

      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!PK) throw new Error("VITE_DEV_PRIVATE_KEY is missing.");
      if (!proposalId.trim()) throw new Error("Proposal ID is required.");

      setSubmitting(true);

      const client = await SupraClient.init(RPC);
      const admin = new SupraAccount(hexToBytes(PK));
      const { sequence_number } = await client.getAccountInfo(admin.address());

      const argPid = bcsSerializeU64(BigInt(proposalId.trim()));

      const serialized = await client.createSerializedRawTxObject(
        admin.address(),
        sequence_number,
        MODULE_ADDR,
        MODULE_NAME,
        FN_CLOSE,
        [], // type args
        [argPid] // args: u64 proposal_id
      );

      const tx = await client.sendTxUsingSerializedRawTransaction(
        admin,
        serialized,
        {
          enableTransactionSimulation: true,
          enableWaitForTransaction: true,
        }
      );

      setLastTx(tx);
      setProposalId("");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card__body">
      <label className="label">Proposal ID</label>
      <input
        className="input"
        placeholder="e.g. 0"
        value={proposalId}
        onChange={(e) => setProposalId(e.target.value)}
        inputMode="numeric"
      />

      <div className="actions">
        <button className="btn" onClick={handleClose} disabled={submitting}>
          {submitting ? "Submitting…" : "Close Proposal"}
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
