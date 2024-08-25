const { promisify } = require('util');
const compress = require('brotli/compress');
const { brotliCompress } = require('zlib');
const decompress = require('brotli/decompress');

const compressAsync = async (input) => {
  const str = JSON.stringify(input);
  const brotliCompressAsync = promisify(brotliCompress);
  const compressedData = await brotliCompressAsync(str);
  return compressedData.toString('base64');
}

const decompressSync = (input) => {
  const compressedDataNonBase64 = Uint8Array.from(atob(input), c => c.charCodeAt(0));
  const decompressedData = decompress(compressedDataNonBase64);
  const decoder = new TextDecoder();
  const decompressedString = decoder.decode(decompressedData);
  console.log("Bytes (base64 decoded):", decompressedString);
  return JSON.parse(decompressedString);
}

var intermediateResult = {"version":"2.0.0"};
compressAsync(intermediateResult).then(base64Data => {
  console.log('Compressed and encoded data:', base64Data);
  const resolved = decompressSync(base64Data);
  console.log('Resolved:', JSON.stringify(resolved));
})








