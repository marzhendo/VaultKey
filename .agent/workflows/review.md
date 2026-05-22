---
description: Review existing code against project rules. Run /review [file or feature] to audit any part of the codebase.
---

## Steps

### 1. Read the target
- Read the file(s) or feature specified by the user
- If no target specified, review the most recently modified files

### 2. Run the security audit

Check each of the following — flag any violation as a [CRITICAL] issue:

- [ ] Is any encryption or decryption happening in JavaScript? → Must be in Rust
- [ ] Is the encryption key (EK) present in JS code, state, or localStorage? → Critical violation
- [ ] Is any plaintext password stored in Zustand, component state, or localStorage? → Critical violation
- [ ] Is `console.log` used with passwords, keys, salts, or nonces? → Critical violation
- [ ] Is the nonce reused across entries? → Critical violation
- [ ] Are Argon2id parameters weakened below minimums (time=3, mem=65536)? → Critical violation
- [ ] Is clipboard cleared after 30 seconds? → Required

### 3. Run the code quality audit

Check each of the following — flag as [WARNING]:

- [ ] Are there any `any` types in TypeScript? → Must fix
- [ ] Are there class components instead of functional? → Must fix
- [ ] Are hardcoded hex colors used instead of `var(--token-name)`? → Must fix
- [ ] Are font-weight 600 or 700 used? → Must fix
- [ ] Are files placed outside the structure defined in rules.md Section 4? → Flag
- [ ] Are there undeclared npm or cargo dependencies? → Flag

### 4. Run the scope audit

- [ ] Does any code implement features outside MVP scope (Section 8)? → Flag as [OUT OF SCOPE]

### 5. Produce the Review Report artifact

```
## Review Report — [Target]

### Summary
Overall assessment: PASS / PASS WITH WARNINGS / FAIL

### Critical issues (must fix before shipping)
- [CRITICAL] description — file:line

### Warnings (should fix)
- [WARNING] description — file:line

### Out of scope
- [OUT OF SCOPE] description — file:line

### Passed checks
- List of checks that passed cleanly

### Recommended next steps
1. ...
```

### 6. Offer to fix
After the report, ask: "Would you like me to fix the critical issues now?"
- If yes: run /plan for each fix, then /implement after approval
- If no: leave the report as a reference
