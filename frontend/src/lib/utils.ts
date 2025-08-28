// Small helpers used in header + components (no Buffer usage)
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().startsWith("0x") ? hex.trim().slice(2) : hex.trim();
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Hex must be even-length and contain only 0-9a-f.");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}

export function shortAddr(addr?: string | null, head = 6, tail = 6) {
  if (!addr) return "";
  const a = addr.trim();
  if (a.length <= head + tail + 2) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
