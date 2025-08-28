import "dotenv/config";
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = process.env.SUPRA_RPC!;
const PK = process.env.SUPRA_PRIVATE_KEY!;

(async () => {
  const client = await SupraClient.init(RPC); // init client
  console.log("Connected RPC:", RPC);

  // Who am I?
  const me = new SupraAccount(Uint8Array.from(Buffer.from(PK, "hex")));
  console.log("My address:", me.address().toString());

  // Basic account info: sequence number, auth key, etc.
  const info = await client.getAccountInfo(me.address());
  console.log("AccountInfo:", info);
})();
