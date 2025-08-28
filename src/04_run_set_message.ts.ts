import "dotenv/config";
import { SupraClient, SupraAccount, BCS } from "supra-l1-sdk";

const RPC = process.env.SUPRA_RPC!;
const PK = process.env.SUPRA_PRIVATE_KEY!;
const MODULE_ADDR = process.env.MODULE_ADDR!;
const MODULE_NAME = "message";
const FN_SET = "set_message";
const NEW_MESSAGE = "Hello from TS SDK!";

(async () => {
  const client = await SupraClient.init(RPC);
  const me = new SupraAccount(Uint8Array.from(Buffer.from(PK, "hex")));
  const { sequence_number } = await client.getAccountInfo(me.address());

  const serialized = await client.createSerializedRawTxObject(
    me.address(),
    sequence_number,
    MODULE_ADDR,
    MODULE_NAME,
    FN_SET,
    [], // type args
    [BCS.bcsSerializeStr(NEW_MESSAGE)] // BCS-encoded args
  );

  const tx = await client.sendTxUsingSerializedRawTransaction(me, serialized, {
    enableWaitForTransaction: true,
    enableTransactionSimulation: true,
  });

  console.log("set_message tx:", tx);
})();
