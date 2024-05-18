const utf8String = 'johnson@email.com:johnson';
const base64String = Buffer.from(utf8String, 'utf-8').toString('base64');

console.log('original base64String', base64String);
console.log('------------------------------');

function isValidBase64(str) {
  // Base64 regex pattern
  const base64Pattern = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
  return base64Pattern.test(str);
}

function decodeBase64(str) {
  if (!isValidBase64(str)) {
    throw new Error('Invalid Base64 string');
  }
  return Buffer.from(str, 'base64', { strict: true }).toString('utf-8');
}

try {
  const decoded1 = decodeBase64(base64String);
  const decoded2 = decodeBase64('am9obnNvbkBlbWFpbC5jb206am9obnNvbo==');
  const decoded3 = decodeBase64('am9obnNvbkBlbWFpbC5jb206am9obnNvbl==');

  console.log('original decode: ', decoded1);
  console.log('non original decode2: ', decoded2);
  console.log('non original decode3: ', decoded3);
} catch (error) {
  console.error('Decoding error:', error.message);
}
