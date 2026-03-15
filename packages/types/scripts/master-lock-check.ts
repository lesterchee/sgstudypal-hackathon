#!/usr/bin/env node
import { execSync } from 'child_process';

function checkLock() {
    try {
        // Find git root to make paths reliable
        const gitRoot = execSync('git rev-parse --show-toplevel').toString().trim();

        // Define protected paths relative to git root
        const protectedPaths = [
            'packages/types',
            'packages/legal-engine/src/calculators',
            'packages/legal-engine/src/rules'
        ].join(' ');

        // Check if there are any git changes in the protected directories
        const status = execSync(`git status --porcelain ${protectedPaths}`, { cwd: gitRoot }).toString().trim();

        if (status.length > 0) {
            // Changes detected. Check if the agent is the Legal Architect agent.
            const agentRole = process.env.AGENT_ROLE || process.env.AGENT_NAME || process.env.AGENT_SKILL || '';
            const isArchitect = agentRole.toLowerCase().includes('architect');

            if (!isArchitect) {
                console.error("❌ STRICT CONSTRAINT VIOLATION: Only the Legal Architect agent is allowed to modify deterministic math or foundational types.");
                console.error("Changed files:");
                console.error(status);
                process.exit(1);
            } else {
                console.log("✅ Legal Architect agent detected. Modification allowed.");
            }
        } else {
            console.log("✅ No changes in protected directories detected.");
        }
    } catch (error) {
        if ((error as any).status !== 0 && !(error as any).stdout) {
            console.error("Error running master-lock-check:", error);
            process.exit(1);
        }
    }
}

checkLock();
