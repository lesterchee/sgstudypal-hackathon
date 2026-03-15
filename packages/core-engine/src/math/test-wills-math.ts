import { GhostCrypto } from '../crypto/ghost-data';
import { WillsCalculator, EncryptedRelative, RelativeRelation } from './wills-calculator';

async function runTest() {
    // Simulate inputs (key sourced from GHOST_CRYPTO_KEY env var)
    const estateValue = '1000000'; // $1,000,000
    const estateValueEncrypted = GhostCrypto.encrypt(estateValue);

    const rawRelatives: { relation: RelativeRelation, name: string }[] = [
        { relation: 'Spouse', name: 'Jane Doe (Wife)' },
        { relation: 'Issue', name: 'John Doe Jr (Child 1)' },
        { relation: 'Issue', name: 'Alice Doe (Child 2)' },
        { relation: 'Issue', name: 'Bob Doe (Child 3)' }
    ];

    const relativesEncrypted: EncryptedRelative[] = rawRelatives.map(r => ({
        relation: r.relation,
        nameEncrypted: GhostCrypto.encrypt(r.name)
    }));

    console.log("--- Encrypted Input ---");
    console.log(`Estate Value Encrypted: ${estateValueEncrypted.substring(0, 30)}...`);
    console.log(`Relatives Encrypted Data provided to calculator:`);
    relativesEncrypted.forEach(r => {
        console.log(`- ${r.relation}: ${r.nameEncrypted.substring(0, 30)}...`);
    });

    // Run calculator
    console.log("\n--- Running Wills Calculator ---");
    const distributions = WillsCalculator.calculateIntestateDistribution(
        estateValueEncrypted,
        relativesEncrypted
    );

    // Decrypt outputs and verify
    console.log("\n--- Decrypted Distribution Results ---");
    let verificationSuccess = true;

    distributions.forEach(d => {
        const decryptedName = GhostCrypto.decrypt(d.nameEncrypted);
        const decryptedAmount = GhostCrypto.decrypt(d.amountEncrypted);
        console.log(`${d.relation} (${decryptedName}): $${decryptedAmount}`);

        // Basic verification for our specific scenario
        if (d.relation === 'Spouse' && decryptedAmount !== '500000.00') {
            verificationSuccess = false;
            console.error(`❌ Spouse should receive $500000.00, but got $${decryptedAmount}`);
        }
        if (d.relation === 'Issue' && decryptedAmount !== '166666.67' && decryptedAmount !== '166666.66') {
            // Note: 500,000 / 3 = 166666.666...
            // the test expects 166666.67
            if (decryptedAmount !== '166666.67' && decryptedAmount !== '166666.66') {
                verificationSuccess = false;
                console.error(`❌ Issue should receive $166666.67, but got $${decryptedAmount}`);
            }
        }
    });

    if (verificationSuccess && distributions.length === 4) {
        console.log(`\n✅ Calculator successfully applied rule: 'Surviving spouse and issue' and preserved Ghost Data encryption!`);
    } else {
        console.log(`\n❌ Validation Failed.`);
    }
}

runTest().catch(console.error);
