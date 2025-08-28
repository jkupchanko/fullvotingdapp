import { SupraClient, SupraAccount } from "supra-l1-sdk";

export interface WalletAdapter {
  connect(): Promise<void>;
  isConnected(): boolean;
  address(): string | null;
  signAndSubmitSerializedTx(
    client: SupraClient,
    serialized: Uint8Array
  ): Promise<any>;
}

// helper: hex -> Uint8Array (no Buffer)
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().startsWith("0x") ? hex.trim().slice(2) : hex.trim();
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("VITE_DEV_PRIVATE_KEY must be even-length hex (no 0x).");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

/** DEV-ONLY: signs with a private key from Vite env. Do NOT ship to prod. */
export class LocalEnvKeyAdapter implements WalletAdapter {
  private _acct: SupraAccount | null = null;
  private _addr: string | null = null;

  async connect(): Promise<void> {
    const pkHex = import.meta.env.VITE_DEV_PRIVATE_KEY as string | undefined;
    if (!pkHex)
      throw new Error("VITE_DEV_PRIVATE_KEY is missing in frontend/.env");

    const acct = new SupraAccount(hexToBytes(pkHex)); // ⬅️ no Buffer
    this._acct = acct;
    this._addr = acct.address().toString();
  }

  isConnected() {
    return !!this._acct && !!this._addr;
  }
  address() {
    return this._addr;
  }

  async signAndSubmitSerializedTx(client: SupraClient, serialized: Uint8Array) {
    if (!this._acct) throw new Error("Not connected.");
    return client.sendTxUsingSerializedRawTransaction(this._acct, serialized, {
      enableTransactionSimulation: true,
      enableWaitForTransaction: true,
    });
  }
}
