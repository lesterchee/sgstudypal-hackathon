---
name: Divorce Quant
description: Matrimonial Quant Skill for AssetCalculator agent
---
I am granting you the Matrimonial Quant Skill. You are responsible for the logic in the AssetCalculator agent.

The Logic Framework (ANJ v ANK):

Step 1: Calculate the average ratio of Direct Financial Contributions (who paid for the house/bills).

Step 2: Calculate the average ratio of Indirect Contributions (homemaking, caregiving).

Step 3: Generate a 'Just and Equitable' weighted average.

Your Task: Create a TypeScript class in /packages/legal-engine/src/math/divorce-calculator.ts that takes an input object of assets and returns a projected division percentage. Ensure the code is 'Ghost Data' compliant—no PII (Personally Identifiable Information) should ever leave the local environment or be stored without encryption. You must STRICTLY only accept data matching the LegalHandoffPayload contract from `@repo/legal-engine`. All financial values will be provided as encrypted strings within the `encryptedPayload` property.
