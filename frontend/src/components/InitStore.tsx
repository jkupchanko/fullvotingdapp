// src/components/InitStore.tsx
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = (import.meta.env.VITE_SUPRA_RPC || "").trim();
const PK = (import.meta.env.VITE_DEV_PRIVATE_KEY || "").trim();
const MODULE_ADDR = (import.meta.env.VITE_MODULE_ADDR || "").trim();
const MODULE_NAME = "voting";
const FN_INIT = "init";

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}

export default function InitStore() {
  async function handleInit() {
    try {
      if (!RPC) throw new Error("VITE_SUPRA_RPC is missing.");
      if (!MODULE_ADDR) throw new Error("VITE_MODULE_ADDR is missing.");
      if (!PK) throw new Error("VITE_DEV_PRIVATE_KEY is missing.");

      const client = await SupraClient.init(RPC);
      const me = new SupraAccount(hexToBytes(PK));
      const { sequence_number } = await client.getAccountInfo(me.address());

      const serialized = await client.createSerializedRawTxObject(
        me.address(),
        sequence_number,
        MODULE_ADDR,
        MODULE_NAME,
        FN_INIT,
        [],
        []
      );

      const res = await client.sendTxUsingSerializedRawTransaction(
        me,
        serialized,
        {
          enableTransactionSimulation: true,
          enableWaitForTransaction: true,
        }
      );

      console.log("init() tx:", res);
      alert("Init submitted! Check console for details.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? String(e));
    }
  }

  return (
    <button className="btn" onClick={handleInit}>
      Build Store
    </button>
  );
}
