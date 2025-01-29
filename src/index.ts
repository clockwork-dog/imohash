import fs from "node:fs";
import mmh3 from "murmurhash3-ts";
import varint from "varint";

const DEFAULT_SAMPLE_THRESHOLD = 128 * 1024; // 128KB
const DEFAULT_SAMPLE_SIZE = 16 * 1024; // 16KB

export interface HashFileOptions {
  sampleThreshold?: number;
  sampleSize?: number;
}

export async function hashFile(
  filePath: string,
  {
    sampleThreshold = DEFAULT_SAMPLE_THRESHOLD,
    sampleSize = DEFAULT_SAMPLE_SIZE,
  }: HashFileOptions = {},
): Promise<Buffer<ArrayBuffer>> {
  // Get file size from file object
  const { size } = await fs.promises.stat(filePath);

  // Get the data from the file
  let data: Uint8Array;
  // If the total file size is under the sample threshold, or if the files is smaller than 4 of the size
  // of the sample chunks we will take, then we just read the entire file
  if (size < sampleThreshold || sampleSize < 1 || size < 4 * sampleSize) {
    data = await fs.promises.readFile(filePath);
  } else {
    // Open the file for reading
    const fileHandle = await fs.promises.open(filePath, "r");
    // Read the first, middle, and end chunks of the given sample size
    const startSample = await fileHandle.read(
      Buffer.alloc(sampleSize),
      0,
      sampleSize,
      0,
    );
    const middleSample = await fileHandle.read(
      Buffer.alloc(sampleSize),
      0,
      sampleSize,
      Math.floor(size / 2),
    );
    const endSample = await fileHandle.read(
      Buffer.alloc(sampleSize),
      0,
      sampleSize,
      size - sampleSize,
    );
    // Combine these into a single Uint8Array
    data = Buffer.concat([
      startSample.buffer,
      middleSample.buffer,
      endSample.buffer,
    ]);
  }

  // Create the hash from the data we've read
  const hash = mmh3.x64.hash128(data);

  // Encode the size of the file using the varint protobuf algorithm
  // https://protobuf.dev/programming-guides/encoding/#varints
  const encodedSize = varint.encode(size);

  // Combine these and return as a Uint8Array
  return Buffer.concat([
    Buffer.from(encodedSize),
    hash.slice(encodedSize.length),
  ]);
}
