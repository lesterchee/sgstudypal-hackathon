import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AssetCalculator } from '../math/divorce-calculator';
import { AssetInput } from '../schemas/asset-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Compass Decision Tree
const compassTreePath = path.join(__dirname, '../agents/metadata/compass-tree.json');
const compassTree = JSON.parse(fs.readFileSync(compassTreePath, 'utf8'));

// High-Conflict Shadow User Persona (Case_001)
const case001Persona = {
    marriageDurationYears: 4,
    hasChildrenUnder21: true,
    crisisStatement: "He blocked my credit cards and is threatening to take the child. I feel unsafe.",
    feelsUnsafe: true, // Derived from crisis statement
};

console.log("==========================================");
console.log("RUNNING SHADOW SIMULATIONS: CASE_001");
console.log("==========================================\n");

// --- COMPASS TRIAGE VERIFICATION ---
console.log("Executing Compass Triage Verification...");

let currentNode = compassTree.nodes[compassTree.root];
let hitPpo = false;
let hitCpp = false;

// Assertion 1: Verify 'Crisis' -> PPO
if (case001Persona.feelsUnsafe) {
    const nextNodeKey = currentNode.options.find((opt: any) => opt.label === 'Yes').next;
    const nextNode = compassTree.nodes[nextNodeKey];
    if (nextNodeKey === 'EMERGENCY_PPO' && nextNode.type === 'ACTION_ALERT') {
        hitPpo = true;
        currentNode = compassTree.nodes[nextNode.next]; // Reset flow to Marriage Duration Check
    }
}

// Proceed down normal flow after crisis evaluation
if (currentNode.question.includes("How long")) {
    const nextNodeKey = currentNode.options.find((opt: any) => opt.label === (case001Persona.marriageDurationYears >= 3 ? '3 years or more' : 'Less than 3 years')).next;
    currentNode = compassTree.nodes[nextNodeKey];
}

// Assertion 2: Verify Children -> CPP
if (currentNode.question.includes("children")) {
    const nextNodeKey = currentNode.options.find((opt: any) => opt.label === (case001Persona.hasChildrenUnder21 ? 'Yes' : 'No')).next;
    currentNode = compassTree.nodes[nextNodeKey];
    if (nextNodeKey === 'MANDATORY_CPP') {
        hitCpp = true;
    }
}

if (!hitPpo) {
    console.error("❌ FAILED: Compass failed to trigger PPO node for unsafe user.");
    process.exit(1);
}
if (!hitCpp) {
    console.error("❌ FAILED: Compass failed to trigger Mandatory CPP node for parents.");
    process.exit(1);
}
console.log("✅ Compass Triage Verification Passed.\n");

// --- QUANTIFICATION VERIFICATION (WRX v WRY Dissipation) ---
console.log("Executing Quantum Constraint Verification (WRX v WRY)...");

const assets: AssetInput[] = [
    {
        assetId: "hdb-001",
        assetType: "property",
        value: 1200000,
        directContribution: { partyA: 600000, partyB: 600000 },
        indirectContribution: { partyA: 50, partyB: 50 }, // 50/50 split
        isDisputed: false,
        isUnknownValue: false,
        hasRedFlags: false,
        isDissipated: false
    },
    {
        assetId: "sav-001",
        assetType: "cash",
        value: 200000,
        directContribution: { partyA: 200000, partyB: 0 },
        indirectContribution: { partyA: 50, partyB: 50 },
        isDisputed: false,
        isUnknownValue: false,
        hasRedFlags: false,
        isDissipated: false
    },
    {
        assetId: "loan-001",
        assetType: "others",
        value: 150000,
        directContribution: { partyA: 150000, partyB: 0 },
        indirectContribution: { partyA: 50, partyB: 50 },
        isDisputed: false,
        isUnknownValue: false,
        hasRedFlags: false,
        isDissipated: true // Husband dissipated this via loan to brother
    }
];

// Simulated Expected Math
// Total Direct Pool calculation strips PartyA's 150k credit because it's dissipated.
// Direct A = 600k (HDB) + 200k (Savings) = 800k
// Direct B = 600k (HDB) + 0 (Savings) + 0 (Dissipated Loan forced forfeiture) = 600k
// Total Direct = 1400k
// Ratio A = 800 / 1400 = 57.14%, Ratio B = 600 / 1400 = 42.86%
// Indirect is 50/50.
// Final A = (57.14 + 50) / 2 = 53.57%
// Final B = (42.86 + 50) / 2 = 46.43%

const expectedPartyA = 53.57;
const expectedPartyB = 46.43;

// Execute Legal Engine math
const divisionResult = AssetCalculator.calculateDivision(assets, 0.5, 0.5, 'partyA');

const varianceA = Math.abs(divisionResult.partyA - expectedPartyA);
const varianceB = Math.abs(divisionResult.partyB - expectedPartyB);

console.log("Expected Output: ", { partyA: expectedPartyA, partyB: expectedPartyB });
console.log("Engine Output: ", { partyA: divisionResult.partyA, partyB: divisionResult.partyB });

if (varianceA > 1 || varianceB > 1) {
    console.error(`❌ FAILED: Logic drift detected in 'divorce-calculator.ts'. Variance in math exceeds 1%. Variance: ${varianceA.toFixed(2)}%`);
    process.exit(1);
}

console.log("✅ Quantum Constraint Verification Passed (Variance < 1%).");
console.log("\n==========================================");
console.log("🎉 SYSTEM HEALTH REPORT: ALL PASSED");
console.log("==========================================\n");
