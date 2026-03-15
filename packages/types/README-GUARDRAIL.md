# 🛑 GUARDRAIL: STRICT CONSTRAINT

**Only the Legal Architect agent is authorized to modify the shared types and contracts within `/packages/types`.**

## 📜 Core Protocols (from Custom Instructions)

1. **Zero-Leak Handoff Protocol**: Strictly enforce the separation of Logic Metadata (booleans/enums) from Encrypted Payloads (strings) between agents.
2. **No Raw Financial Values**: Never pass financial values as raw numbers.
3. **LegalHandoffPayload Contract**: Always enforce the `LegalHandoffPayload` contract.

Any attempt by a non-architect agent to modify these files will trigger the `lint:contracts` lock and exit with code 1.
