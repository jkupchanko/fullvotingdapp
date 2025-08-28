import "dotenv/config";
import { SupraAccount } from "supra-l1-sdk";

// New random account
const fresh = new SupraAccount();
console.log("fresh address:", fresh.address().toString());

// From private key (hex)
const pk = process.env.SUPRA_PRIVATE_KEY || "";
if (pk) {
  const fromPk = new SupraAccount(Uint8Array.from(Buffer.from(pk, "hex")));
  console.log("fromPk address:", fromPk.address().toString());
} else {
  console.log("No SUPRA_PRIVATE_KEY set; skipping fromPk example.");
}
