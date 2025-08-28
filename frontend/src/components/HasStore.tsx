// src/components/HasStore.tsx
import { useEffect, useMemo, useState } from "react";
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const MODULE_NAME = "voting";
const FN_HAS_STORE = "has_store";
const DEV_PK = (import.meta.env.VITE_DEV_PRIVATE_KEY || "").trim();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}

export default function HasStore() {
  const [client, setClient] = useState<SupraClient | null>(null);
  const [addr, setAddr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultAddress = useMemo(() => {
    try {
      if (!DEV_PK) return "";
      const me = new SupraAccount(hexToBytes(DEV_PK));
      return me.address().toString();
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    setAddr(defaultAddress);
  }, [defaultAddress]);

  useEffect(() => {
    (async () => setClient(await SupraClient.init(RPC)))().catch((e) =>
      setError(e?.message ?? String(e))
    );
  }, []);

  async function checkHasStore() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      if (!client) throw new Error("SDK client not ready.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!addr) throw new Error("Enter an address to check.");

      const fn = `${MODULE_ADDR}::${MODULE_NAME}::${FN_HAS_STORE}`;
      const res = await client.invokeViewMethod(fn, [], [addr]);
      const val = Array.isArray(res) ? Boolean(res[0]) : Boolean(res);
      setResult(val);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <input
          className="input"
          value={addr}
          onChange={(e) => setAddr(e.target.value.trim())}
          placeholder="0x... address"
        />
        <button
          className="btn btn--ghost"
          onClick={checkHasStore}
          disabled={loading || !client}
        >
          {loading ? "Checking..." : "Store Created?"}
        </button>
      </div>

      {error && <div className="note note--error">{error}</div>}
      {result !== null && (
        <div className="note">
          Result: <strong>{String(result)}</strong>
        </div>
      )}
    </div>
  );
}
