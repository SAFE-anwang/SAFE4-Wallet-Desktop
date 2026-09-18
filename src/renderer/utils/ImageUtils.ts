


export function HexToImageBase64(hex: string) {
  if (!hex) return undefined;
  if ("0x" === hex) return undefined;
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (binary.startsWith("data:")) return binary;
  return `data:image/png;base64,${btoa(binary)}`;
}
