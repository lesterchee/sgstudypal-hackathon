import { GhostCrypto } from './ghost-data.js';

// The Mock Asset Object
const matrimonialAsset = {
    assetName: 'HDB Flat - Blk 123 Ang Mo Kio Ave 3',
    value: 500000,
};

console.log('--- Ghost Data Encryption Test ---');
console.log('Original Data:', matrimonialAsset);

// 1. Encrypt PII Fields (key sourced from GHOST_CRYPTO_KEY env var)
const encryptedName = GhostCrypto.encrypt(matrimonialAsset.assetName);

const dbPayload = {
    assetName: encryptedName, // This is what goes to Firestore
    value: matrimonialAsset.value, // Pure numbers can stay unencrypted
};

console.log('\nPayload ready for Firestore (Ghost Data compliant):');
console.log(dbPayload);

// 2. Decrypt PII Fields (simulate retrieving from DB)
const decryptedName = GhostCrypto.decrypt(dbPayload.assetName);

const retrievedAsset = {
    assetName: decryptedName,
    value: dbPayload.value,
};

console.log('\nDecrypted Data retrieved from Firestore:');
console.log(retrievedAsset);

if (retrievedAsset.assetName === matrimonialAsset.assetName) {
    console.log('\n✅ TEST PASSED: Decrypted payload perfectly matches original.');
} else {
    console.log('\n❌ TEST FAILED: Decrypted payload does not match original.');
}
