// Purpose: Provide a type-safe utility to retrieve strict MOE pedagogical
// constraints (keywords, forbidden words) based on the current topic
// classification. The dictionary enforces age-appropriate language and
// prevents out-of-syllabus terminology from leaking into AI responses.

import moeDictionary from "@/config/moe-dictionary.json";

// ---------------------------------------------------------------------------
// Purpose: TypeScript interface for a single MOE rule entry.
// ---------------------------------------------------------------------------

/** Purpose: Represents the pedagogical constraints for a single topic. */
export interface MoeRule {
    /** Purpose: Terms the AI MUST use when explaining this topic. */
    mandatory_keywords: string[];
    /** Purpose: Terms the AI must NEVER use — typically out-of-syllabus
     *  vocabulary that would confuse primary school students. */
    forbidden_words: string[];
    /** Purpose: The foundational concept statement that anchors the AI's
     *  explanation. Acts as a guardrail for factual accuracy. */
    core_concept: string;
}

// Purpose: Type the imported JSON as a record of topic IDs to MoeRule objects.
const dictionary: Record<string, MoeRule> = moeDictionary;

// Purpose: Default fallback rule returned when a topic ID is not found
// in the dictionary. Prevents runtime crashes and signals to the AI
// that no special constraints apply.
const FALLBACK_RULE: MoeRule = {
    mandatory_keywords: [],
    forbidden_words: [],
    core_concept: "No specific MOE pedagogical constraints loaded for this topic. Use general best practices.",
};

// ---------------------------------------------------------------------------
// Purpose: Public accessor function for the MOE Dictionary.
// ---------------------------------------------------------------------------

/**
 * Purpose: Retrieve the MOE pedagogical constraints for a given topic ID.
 *
 * @param topicId - The topic classification key, e.g. "math_p6_ratio".
 * @returns The matching MoeRule object, or a safe FALLBACK_RULE if the
 *          topic ID is not found in the dictionary.
 *
 * @example
 * ```ts
 * const rules = getMoeRules("math_p6_ratio");
 * // rules.mandatory_keywords → ["equivalent ratios", "unchanged total", ...]
 * // rules.forbidden_words    → ["cross-multiply", "algebraic substitution", ...]
 * ```
 */
export function getMoeRules(topicId: string): MoeRule {
    return dictionary[topicId] ?? FALLBACK_RULE;
}

/**
 * Purpose: Get all available topic IDs in the dictionary.
 * Useful for validation or auto-complete in admin tools.
 */
export function getAllTopicIds(): string[] {
    return Object.keys(dictionary);
}
