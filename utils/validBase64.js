export default function isValidBase64(str) {
  // Check if the string length is a multiple of 4
  if (str.length % 4 !== 0) {
    console.log('base64 invalid,  not multiple of 4');
    return false;
  }

  // Regular expression to check for valid Base64 characters
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

  // Test the string against the regex
  if (!base64Regex.test(str)) {
    console.log('base64 invalid');
    return false;
  }

  try {
    // Try decoding the string
    const decodedBase64 = Buffer.from(str, 'base64').toString('utf-8');
    return decodedBase64;
  } catch (e) {
    // If decoding fails, it's not valid Base64
    return false;
  }
}
