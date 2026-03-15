import { GhostCrypto } from '../crypto/ghost-data';
import intestacyRules from '../rules/wills/intestacy-rules.json';
import appointmentLogic from '../rules/wills/appointment-logic.json';

export type RelativeRelation = 'Spouse' | 'Issue' | 'Parent' | 'Brother/Sister' | 'Grandparent' | 'Uncle/Aunt';

export interface EncryptedRelative {
    relation: RelativeRelation;
    nameEncrypted: string;
}

export interface EncryptedDistribution {
    relation: string;
    nameEncrypted: string;
    amountEncrypted: string;
}

export interface WillValidationResult {
    isValid: boolean;
    alerts: Array<{
        type: 'CRITICAL' | 'WARNING' | 'INFO';
        message: string;
    }>;
    requiresGuardianAppointment: boolean;
}

export class WillsCalculator {
    /**
     * Validates a will for compliance against the Wills Act, such as Section 9 rules
     * and ensuring minor children have guardians appointed.
     */
    public static validateWillCompliance(
        beneficiaryIds: string[],
        witnessIds: string[],
        hasChildrenUnder21: boolean
    ): WillValidationResult {
        const result: WillValidationResult = {
            isValid: true,
            alerts: [],
            requiresGuardianAppointment: false
        };

        // Section 9 'Void' Check: Beneficiary cannot be a witness
        for (const witnessId of witnessIds) {
            if (beneficiaryIds.includes(witnessId)) {
                result.isValid = false;
                result.alerts.push({
                    type: 'CRITICAL',
                    message: 'CRITICAL: Witness is a Beneficiary. This gift will be VOID under Section 9 of the Wills Act.'
                });
            }
        }

        // Guardian Appointment Check for minors
        if (hasChildrenUnder21) {
            result.requiresGuardianAppointment = true;
            result.alerts.push({
                type: 'WARNING',
                message: 'Mandatory Guardian Appointment required for children under 21.'
            });
        }

        return result;
    }

    public static calculateIntestateDistribution(
        estateValueEncrypted: string,
        relativesEncrypted: EncryptedRelative[]
    ): EncryptedDistribution[] {
        // 1. Decrypt estate value
        const estateValueStr = GhostCrypto.decrypt(estateValueEncrypted);
        const estateValue = parseFloat(estateValueStr);
        if (isNaN(estateValue)) {
            throw new Error("Invalid estate value");
        }

        // 2. Decrypt relatives
        const relatives = relativesEncrypted.map(r => ({
            relation: r.relation,
            name: GhostCrypto.decrypt(r.nameEncrypted),
            originalEncryptedName: r.nameEncrypted
        }));

        const rolesPresent = new Set(relatives.map(r => r.relation));

        // 3. Determine applicable rule from JSON based on roles
        let matchedRuleIndex = -1;

        const hasSpouse = rolesPresent.has('Spouse');
        const hasIssue = rolesPresent.has('Issue');
        const hasParent = rolesPresent.has('Parent');
        const hasSibling = rolesPresent.has('Brother/Sister');
        const hasGrandparent = rolesPresent.has('Grandparent');
        const hasUncleAunt = rolesPresent.has('Uncle/Aunt');

        // Note: The index corresponds to rules in intestacy-rules.json
        // Rule 1: Spouse, no issue, no parents
        if (hasSpouse && !hasIssue && !hasParent) matchedRuleIndex = 0;
        // Rule 2: Spouse and issue
        else if (hasSpouse && hasIssue) matchedRuleIndex = 1;
        // Rule 3: Issue, no spouse
        else if (!hasSpouse && hasIssue) matchedRuleIndex = 2;
        // Rule 4: Spouse and parents, no issue
        else if (hasSpouse && hasParent && !hasIssue) matchedRuleIndex = 3;
        // Rule 5: Parents, no spouse, no issue
        else if (hasParent && !hasSpouse && !hasIssue) matchedRuleIndex = 4;
        // Rule 6: Siblings, no spouse, no issue, no parents
        else if (hasSibling && !hasSpouse && !hasIssue && !hasParent) matchedRuleIndex = 5;
        // Rule 7: Grandparents, etc.
        else if (hasGrandparent && !hasSpouse && !hasIssue && !hasParent && !hasSibling) matchedRuleIndex = 6;
        // Rule 8: Uncles/Aunts, etc.
        else if (hasUncleAunt && !hasSpouse && !hasIssue && !hasParent && !hasSibling && !hasGrandparent) matchedRuleIndex = 7;
        // Rule 9: Government (no relatives)
        else matchedRuleIndex = 8;

        const rule = intestacyRules.rules[matchedRuleIndex];

        // 4. Calculate distributions
        const results: EncryptedDistribution[] = [];

        for (const dist of rule.distribution) {
            // Parse percentage (e.g., "50%", "100%")
            const pctMatch = dist.share.match(/(\d+)%/);
            const percentage = pctMatch ? parseFloat(pctMatch[1]) / 100 : 0;
            const totalAmountForGroup = estateValue * percentage;

            // Map beneficiary terminology from JSON to our Relation type
            let targetRelation: RelativeRelation | null = null;
            if (dist.beneficiary === 'Spouse') targetRelation = 'Spouse';
            else if (dist.beneficiary === 'Issue') targetRelation = 'Issue';
            else if (dist.beneficiary === 'Parents') targetRelation = 'Parent';
            else if (dist.beneficiary === 'Brothers and Sisters') targetRelation = 'Brother/Sister';
            else if (dist.beneficiary === 'Grandparents') targetRelation = 'Grandparent';
            else if (dist.beneficiary === 'Uncles and Aunts') targetRelation = 'Uncle/Aunt';

            if (targetRelation) {
                const groupMembers = relatives.filter(r => r.relation === targetRelation);
                if (groupMembers.length > 0) {
                    const amountPerMember = totalAmountForGroup / groupMembers.length;
                    for (const member of groupMembers) {
                        results.push({
                            relation: member.relation,
                            nameEncrypted: member.originalEncryptedName,
                            amountEncrypted: GhostCrypto.encrypt(amountPerMember.toFixed(2))
                        });
                    }
                }
            } else if (dist.beneficiary === 'Government') {
                results.push({
                    relation: 'Government',
                    nameEncrypted: GhostCrypto.encrypt('Government of Singapore'),
                    amountEncrypted: GhostCrypto.encrypt(totalAmountForGroup.toFixed(2))
                });
            }
        }

        return results;
    }
}
