import { useState } from "react";
import { SupraClient } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const MODULE_NAME = "voting";
const FN_GET = "get_votes";

export default function GetVotes() {
  const [owner, setOwner] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [tallies, setTallies] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    try {
      setError(null);
      setTallies(null);

      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!owner.trim()) throw new Error("Owner address is required.");
      if (!proposalId.trim()) throw new Error("Proposal ID is required.");

      setLoading(true);
      const client = await SupraClient.init(RPC);

      const res = await client.invokeViewMethod(
        `${MODULE_ADDR}::${MODULE_NAME}::${FN_GET}`,
        [],
        [owner.trim(), proposalId.trim()]
      );

      // Normalize likely response shapes into number[]
      let values: any[] = [];
      if (Array.isArray(res)) {
        values = Array.isArray(res[0]) ? res[0] : res;
      } else if (res?.result) {
        values = Array.isArray(res.result[0]) ? res.result[0] : res.result;
      }
      const nums = values.map((v: any) => Number(v ?? 0));
      setTallies(nums);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const total = (tallies ?? []).reduce((a, b) => a + b, 0);
  return (
    <div className="card">
      <h2 className="card__title">Results</h2>
      <p className="card__hint">
        View <code>get_votes(owner, proposal_id)</code>. Each bar is votes /
        total.
      </p>

      <div className="card__body">
        <label className="label">Owner address</label>
        <input
          className="input"
          placeholder="0x…"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
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

        <div className="actions">
          <button className="btn" onClick={handleFetch} disabled={loading}>
            {loading ? "Loading…" : "Get Votes"}
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {tallies && (
          <div className="stats">
            <div className="stats__row">
              <div className="stats__total">
                Total votes: <strong>{total}</strong>
              </div>
            </div>
            {tallies.map((n, i) => {
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <div key={i} className="stats__row">
                  <div className="stats__label">Option {i}</div>
                  <div className="stats__bar">
                    <div
                      className="stats__barFill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="stats__value">
                    {n} <span className="stats__pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
