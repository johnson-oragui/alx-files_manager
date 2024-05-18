export default function isValidBase64(token) {
  // Check if the token length is a multiple of 4
  if (token.length % 4 !== 0) {
    console.log('base64 invalid,  not multiple of 4');
    return false;
  }

  // Regular expression to check for valid Base64 characters
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

  // Test the string against the regex
  if (!base64Regex.test(token)) {
    console.log('base64 invalid');
    return false;
  }

  try {
    // Try decoding the token to utf8
    const decodedBase64 = Buffer.from(token, 'base64').toString('utf-8');
    console.log('decoded: ', decodedBase64);

    // change the decodedbase64 string back to base64 string
    const toBase64 = Buffer.from(decodedBase64, 'utf-8').toString('base64');

    // compare the base64 token from parameter with the re-coded base64 str
    if (toBase64 !== token) return false;

    // If all checks pass, return the decoded string
    return decodedBase64;
  } catch (e) {
    console.error('invalid base64 token: ', e.message);
    // If decoding fails, it's not valid Base64
    return false;
  }
}
