import { createFsFromVolume, vol } from "memfs";
export * from "memfs";

const fakeFs = createFsFromVolume(vol);
export default fakeFs;
export const promises = fakeFs.promises;
