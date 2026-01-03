const testKey = 'H9qtqKGBMUFzH8F0kz4ihdw3MTBb0WbpJ1TLLuRLxHZM1';
const prodKey = 'TjTvxtvBwdEux3d4AYJKer7wjorXwKmcMiBlpq6E0CuKj';

function analyze(label, key) {
    console.log(`--- ${label} ---`);
    console.log(`Raw: "${key}" (Len: ${key.length})`);

    // Try Base64
    const b64 = Buffer.from(key, 'base64');
    console.log(`Base64 Decoded Length: ${b64.length} bytes`);
    console.log(`Base64 Hex: ${b64.toString('hex')}`);

    // Try UTF-8
    const utf8 = Buffer.from(key, 'utf8');
    console.log(`UTF-8 Byte Length: ${utf8.length} bytes`);
}

analyze('TEST KEY', testKey);
analyze('PROD KEY', prodKey);
