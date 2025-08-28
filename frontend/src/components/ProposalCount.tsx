import { useState } from "react";
import { SupraClient } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();

const MODULE_NAME = "voting";
const FN_GET_COUNT = "get_proposal_count";

export default function ProposalCount() {
  const [owner, setOwner] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<string | null>(null);

  async function handleGetCount() {
    try {
      setError(null);
      setCount(null);
      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!owner.trim()) throw new Error("Enter an owner address.");

      setLoading(true);
      const client = await SupraClient.init(RPC);

      // View calls use plain arguments (no BCS): pass the address string.
      const res = await client.invokeViewMethod(
        `${MODULE_ADDR}::${MODULE_NAME}::${FN_GET_COUNT}`,
        [],
        [owner.trim()]
      );

      // SDK typically returns JSON-compatible values; stringify defensively.
      // If it's an array like ["3"], normalize to the first element.
      let value: string;
      if (Array.isArray(res) && res.length) value = String(res[0]);
      else value = String(res);

      setCount(value);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginTop: 16,
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        maxWidth: 720,
      }}
    >
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
        Owner address
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="0x… owner (store) address"
          spellCheck={false}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #D0D5DD",
            outline: "none",
          }}
        />
        <button
          onClick={handleGetCount}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #175CD3",
            background: loading ? "#B2DDFF" : "#2E90FA",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Reading…" : "Get Count"}
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

      {count !== null && !error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#EEF4FF",
            color: "#3538CD",
            border: "1px solid #C7D2FE",
          }}
        >
          <strong>Current proposal count:</strong> {count}
        </div>
      )}
    </section>
  );
}
