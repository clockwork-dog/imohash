# imohash for JavaScript & TypeScript

imohash is a fast, constant-time hashing library for JavaScript & TypeScript. It uses file size and sampling to calculate hashes quickly, regardless of file size.

It was originally released as a [Go library](https://github.com/kalafut/imohash).

## Installation

`npm install imohash`

or

`yarn add imohash`

## Usage

```javascript
import { hashFile } from "imohash";

const hash = await hashFile("/tmp/path/to/file");
const hashInHex = hash.toString("hex");
```

## Uses

Because imohash only reads a small portion of a file's data, it is very fast and
well suited to file synchronization and deduplication, especially over a fairly
slow network. A need to manage media (photos and video) over Wi-Fi between a NAS
and multiple family computers is how the library was born.

If you just need to check whether two files are the same, and understand the
limitations that sampling imposes (see below), imohash may be a good fit.

## Misuses

Because imohash only reads a small portion of a file's data, it is not suitable
for:

- file verification or integrity monitoring
- cases where fixed-size files are manipulated
- anything cryptographic

## Design

The algorithm is described in the
[original repository](https://github.com/kalafut/imohash/blob/master/algorithm.md).

## Development

You can run type checking, linting, and tests with these commands:

```
yarn run types
yarn run lint
yarn run test
```

Building the library for release can be done with:

```
yarn run build
```

You can also run the bundler in watch mode with:

```
yarn run watch
```

## Alternative implementations

- **Go**: https://github.com/kalafut/imohash
- **Java**: https://github.com/dynatrace-oss/hash4j
- **Python**: https://raw.githubusercontent.com/kalafut/py-imohash
- **Rust**: https://github.com/hiql/imohash

## License

MIT
