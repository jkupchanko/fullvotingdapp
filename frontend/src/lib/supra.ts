import { SupraClient } from "supra-l1-sdk";

let clientPromise: Promise<SupraClient> | null = null;

export function getClient() {
  if (!clientPromise) {
    const rpc = import.meta.env.VITE_SUPRA_RPC as string;
    clientPromise = SupraClient.init(rpc);
  }
  return clientPromise;
}
