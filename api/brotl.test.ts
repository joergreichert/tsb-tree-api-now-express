const compress = require('brotli/compress');
var intermediateResult = {"version":"2.0.0"};
const str = JSON.stringify(intermediateResult, null, 2);
const result = Buffer.from(compress(str, true)).toString('base64');
console.log(result)
