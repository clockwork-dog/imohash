import fs from "node:fs";
import mmh3 from "murmurhash3js-revisited";
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
    // Create a buffer to write into
    const buffer = Buffer.alloc(sampleSize * 3);
    data = buffer;
    // Open the file for reading
    const fileHandle = await fs.promises.open(filePath, "r");
    // Read the first, middle, and end chunks of the given sample size
    await fileHandle.read(buffer, 0, sampleSize, 0);
    await fileHandle.read(buffer, sampleSize, sampleSize, Math.floor(size / 2));
    await fileHandle.read(
      buffer,
      sampleSize * 2,
      sampleSize,
      size - sampleSize,
    );
    // Close the file handler
    await fileHandle.close();
  }

  // Create the hash from the data we've read. Annoyingly the library returns this as a hex
  // string, but we want it to be a Uint8Array so we can combine it with the encoded size
  const hashHexString = mmh3.x64.hash128(data);
  const hash = Buffer.from(hashHexString, "hex");

  // Encode the size of the file using the varint protobuf algorithm
  // https://protobuf.dev/programming-guides/encoding/#varints
  const encodedSize = varint.encode(size);

  // Combine these and return as an ArrayBuffer
  return Buffer.concat([
    Buffer.from(encodedSize),
    hash.subarray(encodedSize.length),
  ]);
}
