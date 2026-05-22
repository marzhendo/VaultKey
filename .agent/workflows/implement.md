---
description: Execute a previously approved implementation plan. Always run /plan first and get user approval before running /implement.
---

## Steps

### 1. Verify plan was approved
- Confirm the user has reviewed and approved an implementation plan
- If no plan exists for this task, stop and run /plan first

### 2. Re-read relevant rules
- Re-read the sections of `.antigravity/rules.md` relevant to this task
- File structure (Section 4), design tokens (Section 5), security constraints (Section 7)

### 3. Implement in order — Rust first, React second

#### If the task involves Rust (src-tauri/):
1. Define or update types/structs in the relevant module
2. Implement the core logic (crypto, db access)
3. Expose as a `#[tauri::command]` in `commands/`
4. Register the command in `main.rs`
5. Test mentally: does this command ever return a raw key or plaintext password as a persistent value? If yes, refactor.

#### If the task involves React (src/):
1. Define or update TypeScript interfaces in `src/types/vault.ts`
2. Build or update reusable UI primitives in `src/components/ui/` if needed
3. Build the feature component in the correct directory (layout/, vault/, pages/)
4. Wire up `invoke()` calls — never put crypto logic in JS
5. Apply styles using only `var(--token-name)` from `tokens.css` — no hardcoded hex

### 4. Follow code standards on every file
- TypeScript strict mode — no `any`
- Functional React components only
- No `console.log` for sensitive values
- CSS: only `var(--token-name)` tokens, weights 400 or 500 only
- Comments: explain *why*, not *what*

### 5. Self-review checklist before finishing
Before marking the task done, verify:
- [ ] No plaintext password or key is stored in JS state or localStorage
- [ ] No `console.log` outputs sensitive data
- [ ] All new CSS uses `var(--token-name)` tokens
- [ ] All new components have TypeScript types
- [ ] File was created in the correct location per Section 4 of rules.md
- [ ] Nonce is freshly generated on every encrypt call
- [ ] New Tauri commands are registered in main.rs

### 6. Produce a Walkthrough artifact
After completing implementation, output:

```
## Walkthrough — [Task Name]

### What was built
Brief description of the completed feature.

### Files created
- path/to/file.tsx

### Files modified
- path/to/file.ts — what changed

### How to test
Step-by-step instructions to verify the feature works.

### Security notes
Any security decisions made during implementation.
```
