// ---------------------------------------------------------------------------
// Purpose: PDPA-compliant logger utility that masks PII (emails, phone numbers)
// before writing to runtime logs. Prevents raw PII leakage in Vercel Function Logs.
// ---------------------------------------------------------------------------

// Purpose: Mask email addresses — e.g., "lester@gmail.com" → "l***@g***.com"
function maskEmail(email: string): string {
    return email.replace(
        /([a-zA-Z0-9])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9])[a-zA-Z0-9.-]*\.([a-zA-Z]{2,})/g,
        "$1***@$2***.$3",
    );
}

// Purpose: Mask phone numbers — e.g., "91234567" → "****4567"
function maskPhone(input: string): string {
    // Match 8-digit SG numbers, international formats, and +XX prefixed numbers.
    return input.replace(
        /(\+?\d{1,4}[\s-]?)?\d{4,}(\d{4})/g,
        (match, prefix, lastFour) => {
            const masked = "****" + lastFour;
            return prefix ? prefix + masked : masked;
        },
    );
}

// Purpose: Recursively mask PII in any serializable value.
function maskPII(value: unknown): unknown {
    if (typeof value === "string") {
        return maskPhone(maskEmail(value));
    }
    if (value instanceof Error) {
        return maskPhone(maskEmail(value.message));
    }
    if (Array.isArray(value)) {
        return value.map(maskPII);
    }
    if (value && typeof value === "object") {
        const masked: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            masked[k] = maskPII(v);
        }
        return masked;
    }
    return value;
}

/**
 * Purpose: PDPA-safe error logger. Masks emails and phone numbers before
 * writing to console.error. Drop-in replacement for `console.error()`.
 */
export function secureLog(message: string, ...args: unknown[]): void {
    const maskedMsg = maskPII(message) as string;
    const maskedArgs = args.map(maskPII);
    console.error(maskedMsg, ...maskedArgs);
}

/**
 * Purpose: PDPA-safe warn logger.
 */
export function secureWarn(message: string, ...args: unknown[]): void {
    const maskedMsg = maskPII(message) as string;
    const maskedArgs = args.map(maskPII);
    console.warn(maskedMsg, ...maskedArgs);
}
