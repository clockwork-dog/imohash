import crypto from "node:crypto";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { hashFile } from "./index.js";

const tempDirPath = tmpdir();

function generateTestData(size: number) {
  const chunks: Buffer[] = [];
  let hasher = crypto.createHash("md5");
  while (16 * chunks.length < size) {
    hasher.update("A");
    const nextHasher = hasher.copy(); // Copy before getting the digest
    chunks.push(hasher.digest());
    hasher = nextHasher;
  }
  return Buffer.concat(chunks, size);
}

test.for([
  [16384, 131072, 0, "00000000000000000000000000000000"],
  [16384, 131072, 1, "01659e2ec0f3c75bf39e43a41adb5d4f"],
  [16384, 131072, 127, "7f47671cc79d4374404b807249f3166e"],
  [16384, 131072, 128, "800183e5dbea2e5199ef7c8ea963a463"],
  [16384, 131072, 4095, "ff1f770d90d3773949d89880efa17e60"],
  [16384, 131072, 4096, "802048c26d66de432dbfc71afca6705d"],
  [16384, 131072, 131072, "8080085a3d3af2cb4b3a957811cdf370"],
  [16384, 131073, 131072, "808008282d3f3b53e1fd132cc51fcc1d"],
  [16384, 131072, 500000, "a0c21e44a0ba3bddee802a9d1c5332ca"],
  [50, 131072, 300000, "e0a712edd8815c606344aed13c44adcf"],
  [0, 100, 999, "e7078bfc9bdf7d7706adbd21002bb752"],
  [50, 9999, 999, "e7078bfc9bdf7d7706adbd21002bb752"],
  [250, 20, 999, "e7078bfc9bdf7d7706adbd21002bb752"],
  [250, 20, 1000, "e807ae87d3dafb5eb6518a5a256297e9"],
] as const)(
  "sampleSize: %i - sampleThreshold: %i - size: %i",
  async ([sampleSize, sampleThreshold, size, expectedHash]) => {
    // Write the example file to the in-memory filesystem
    const TEST_FILE_PATH = path.join(
      tempDirPath,
      `${Math.floor(Math.random() * 1000000)}`,
    );
    const testData = generateTestData(size);
    await fs.promises.writeFile(TEST_FILE_PATH, testData);

    // Hash the in-memory file
    const output = await hashFile(TEST_FILE_PATH, {
      sampleSize,
      sampleThreshold,
    });

    // Check the output matches what we expect
    expect(output.toString("hex")).toEqual(expectedHash);
  },
);

//     for test in tests:
//         with open(".test_data", "wb") as f:
//             f.write(M(test[2]))
//         assert (
//             binascii.hexlify(
//                 hashfile(".test_data", sample_threshhold=test[1], sample_size=test[0])
//             )
//             == test[3].encode()
//         )
//         os.remove(".test_data")
