// generate-signature.js
const crypto = require('crypto');
const fs = require('fs');

// --- ⚠️ ACTION REQUIRED ⚠️ ---
// 1. Make sure your IPN secret is correct here.
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || 'ALaqaNN19LLl880MPHrPU4OpluZajSHc';

// 2. The path to your JSON body file.
const BODY_FILE_PATH = './gen.json'; 
// ------------------------------

/**
 * This function is CRITICAL. It must be identical to the one in your Vendure plugin.
 * It recursively sorts the keys of an object alphabetically.
 */
function sortObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sortObject(item));
    }
    // This is the key part: get keys, sort them, then build a new object.
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObject(obj[key]);
        return result;
    }, {});
}


try {
    // if (!IPN_SECRET || IPN_SECRET.includes('YOUR_IPN_SECRET_HERE')) {
    //     throw new Error('Please paste your NOWPAYMENTS_IPN_SECRET into the IPN_SECRET constant in this script.');
    // }
    const requestBodyRaw = fs.readFileSync(BODY_FILE_PATH, 'utf-8');
    const bodyJson = JSON.parse(requestBodyRaw);

    // This is where the magic happens. We sort the object BEFORE stringifying it.
    const sortedBodyString = JSON.stringify(sortObject(bodyJson));

    // --- DEBUGGING ---
    // This will now print the correctly sorted string.
    console.log('--- JS SCRIPT: String to be signed ---');
    console.log(sortedBodyString);
    // -----------------

    const hmac = crypto.createHmac('sha512', IPN_SECRET);
    hmac.update(sortedBodyString);
    const signature = hmac.digest('hex');

    console.log('\n✅ Generated NOWPayments Signature:\n');
    console.log(signature);

} catch (error) {
    console.error('❌ Error generating signature:', error.message);
    process.exit(1);
}
