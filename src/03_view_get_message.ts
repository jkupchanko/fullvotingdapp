import "dotenv/config";
import { SupraClient, SupraAccount } from "supra-l1-sdk";

const RPC = process.env.SUPRA_RPC!;
const PK = process.env.SUPRA_PRIVATE_KEY!;
const MODULE_ADDR = process.env.MODULE_ADDR!; // publisher address
const MODULE_NAME = "message";
const FN_GET = "get_message";

(async () => {
  const client = await SupraClient.init(RPC);
  const me = new SupraAccount(Uint8Array.from(Buffer.from(PK, "hex")));
  const addrStr = me.address().toString();

  const res = await client.invokeViewMethod(
    `${MODULE_ADDR}::${MODULE_NAME}::${FN_GET}`,
    [], // type args
    [addrStr] // regular (non-BCS) args for view methods
  );

  console.log("get_message result:", res);
})();
