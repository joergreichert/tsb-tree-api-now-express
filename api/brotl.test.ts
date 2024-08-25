const compress = require('brotli/compress');
const zlib = require('zlib');
var intermediateResult = {"version":"2.0.0"};
const str = JSON.stringify(intermediateResult);
zlib.brotliCompress(str, (err, compressedData) => {
  if (err) {
      console.error('Error compressing data:', err);
      return;
  }

  const base64Data = compressedData.toString('base64');

  console.log('Compressed and encoded data:', base64Data);

  const decompress = require('brotli/decompress');
  const compressedDataNonBase64 = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const decompressedData = decompress(compressedDataNonBase64);
  const decoder = new TextDecoder();
  const decompressedString = decoder.decode(decompressedData);
  console.log("Bytes (base64 decoded):", decompressedString);
  const json = JSON.parse(decompressedString);
  
});








