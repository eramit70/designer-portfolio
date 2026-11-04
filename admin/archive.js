/** Minimal stored ZIP writer: no third-party scripts, compression or executable content. */
const encoder = new TextEncoder();
const table = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(bytes) {
  let n = 0xffffffff;
  for (const byte of bytes) n = table[(n ^ byte) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
}
function header(size, values) {
  const bytes = new Uint8Array(size),
    view = new DataView(bytes.buffer);
  for (const [at, value, width] of values)
    width === 2
      ? view.setUint16(at, value, true)
      : view.setUint32(at, value, true);
  return bytes;
}
export function zip(files) {
  const chunks = [],
    central = [];
  let offset = 0,
    count = 0;
  for (const [path, value] of files) {
    if (path.startsWith("/") || path.split("/").includes(".."))
      throw new Error("Unsafe archive path.");
    const name = encoder.encode(path),
      bytes = typeof value === "string" ? encoder.encode(value) : value,
      checksum = crc(bytes);
    const local = header(30, [
      [0, 0x04034b50, 4],
      [4, 20, 2],
      [6, 0x800, 2],
      [12, 33, 2],
      [14, checksum, 4],
      [18, bytes.length, 4],
      [22, bytes.length, 4],
      [26, name.length, 2],
    ]);
    const directory = header(46, [
      [0, 0x02014b50, 4],
      [4, 20, 2],
      [6, 20, 2],
      [8, 0x800, 2],
      [14, 33, 2],
      [16, checksum, 4],
      [20, bytes.length, 4],
      [24, bytes.length, 4],
      [28, name.length, 2],
      [42, offset, 4],
    ]);
    chunks.push(local, name, bytes);
    central.push(directory, name);
    offset += local.length + name.length + bytes.length;
    count++;
  }
  const size = central.reduce((n, b) => n + b.length, 0);
  return new Blob(
    [
      ...chunks,
      ...central,
      header(22, [
        [0, 0x06054b50, 4],
        [8, count, 2],
        [10, count, 2],
        [12, size, 4],
        [16, offset, 4],
      ]),
    ],
    { type: "application/zip" },
  );
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
