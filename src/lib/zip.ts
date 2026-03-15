import archiver from "archiver";
import { PassThrough } from "node:stream";

export async function createZipArchive(
  entries: Array<{
    name: string;
    buffer: Uint8Array;
  }>,
) {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    output.on("close", () => {
      resolve(Buffer.concat(chunks));
    });
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    for (const entry of entries) {
      archive.append(Buffer.from(entry.buffer), {
        name: entry.name,
      });
    }

    void archive.finalize();
  });
}
