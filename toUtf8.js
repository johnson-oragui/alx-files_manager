const utf8String = 'johnson@email.com:johnson';

const base64String = Buffer.from(utf8String, 'utf-8').toString('base64');

console.log(base64String);
