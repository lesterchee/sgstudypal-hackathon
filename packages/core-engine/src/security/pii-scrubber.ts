// Purpose: Defines regular expressions for detecting Singapore NRIC/FINs, phone numbers, and bank patterns.
export const regexPatterns = {
    nric: /[STFG]\d{7}[A-Z]/gi,
    phone: /(?:\+65\s?)?[89]\d{7}/g,
    bankAccount: /\b\d{3}[-\s]?\d{1,3}[-\s]?\d{4,7}\b/g
};

// Purpose: Scans input strings, replaces detected PII with deterministic placeholders, and maintains a map to re-hydrate the data post-LLM processing if necessary.
export function sanitizeForLLM(input: string): { sanitizedString: string, piiMap: Record<string, string> } {
    let sanitizedString = input;
    const piiMap: Record<string, string> = {};
    let counter = 0;

    const replaceMatch = (match: string, type: string) => {
        const existingKey = Object.keys(piiMap).find(key => piiMap[key] === match);
        if (existingKey) return existingKey;

        const placeholder = `[${type}_${counter++}]`;
        piiMap[placeholder] = match;
        return placeholder;
    };

    sanitizedString = sanitizedString.replace(regexPatterns.nric, (match) => replaceMatch(match, 'NRIC_FIN'));
    sanitizedString = sanitizedString.replace(regexPatterns.phone, (match) => replaceMatch(match, 'PHONE'));
    sanitizedString = sanitizedString.replace(regexPatterns.bankAccount, (match) => replaceMatch(match, 'BANK_ACCT'));

    return { sanitizedString, piiMap };
}
