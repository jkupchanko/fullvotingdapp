// src/components/HeaderStatus.tsx
import { useMemo } from "react";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const ADMIN_ADDR = (import.meta.env.VITE_ADMIN_ADDR || "").trim(); // optional; if you already derive it elsewhere, keep your version
const VOTER_ADDR = (import.meta.env.VITE_VOTER_ADDR || "").trim();

function shorten(addr: string, head = 6, tail = 6) {
  if (!addr) return "";
  const clean = addr.startsWith("0x") ? addr : `0x${addr}`;
  if (clean.length <= head + tail + 2) return clean;
  return `${clean.slice(0, 2 + head)}…${clean.slice(-tail)}`;
}

export default function HeaderStatus() {
  const netLabel = useMemo(() => {
    // very lightweight label from RPC; customize if you like
    if (RPC.includes("testnet")) return "Testnet";
    if (RPC.includes("localhost") || RPC.includes("127.0.0.1")) return "Local";
    return "Network";
  }, []);

  return (
    <div className="status">
      <span className="pill">
        <span className="dot dot--ok" />
        {netLabel}
      </span>

      {ADMIN_ADDR && (
        <span className="pill">
          <span className="dot" />
          <strong>Admin:</strong>&nbsp;{shorten(ADMIN_ADDR)}
        </span>
      )}

      {MODULE_ADDR && (
        <span className="pill">
          <span className="dot" />
          <strong>Module:</strong>&nbsp;{shorten(MODULE_ADDR)}
        </span>
      )}

      {VOTER_ADDR && (
        <span className="pill">
          <span className="dot" />
          <strong>Voter:</strong>&nbsp;{shorten(VOTER_ADDR)}
        </span>
      )}
    </div>
  );
}
