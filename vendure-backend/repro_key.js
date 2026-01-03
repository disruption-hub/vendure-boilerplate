const key = 'TjTvxtvBwdEux3d4AYJKer7wjorXwKmcMiBlpq6E0CuKj';
const buf = Buffer.from(key, 'base64');
console.log('Key:', key);
console.log('Buffer length:', buf.length);
console.log('Buffer hex:', buf.toString('hex'));

const keyPadded = key + '=';
const bufPadded = Buffer.from(keyPadded, 'base64');
console.log('Key Padded:', keyPadded);
console.log('Buffer Padded length:', bufPadded.length);
console.log('Buffer Padded hex:', bufPadded.toString('hex'));
