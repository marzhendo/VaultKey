---
description: Generate a structured implementation plan before writing any code. Always run /plan before /implement.
---

## Steps

### 1. Read project constitution
- Read `.antigravity/rules.md` fully
- Identify which sections are relevant to this task (design, security, file structure, scope)

### 2. Understand the task
- Restate the user's request in your own words
- Identify which files will be created or modified
- Identify which Tauri commands (Rust) are involved, if any
- Flag any security-sensitive operations in the task

### 3. Check scope
- Verify the task is within MVP scope (Section 8 of rules.md)
- If out of scope, stop and notify the user before proceeding

### 4. Produce the Implementation Plan artifact
Output a markdown document with these sections:

```
## Implementation Plan — [Task Name]

### Summary
One paragraph describing what will be built and why.

### Files to create
- path/to/file.tsx — reason

### Files to modify
- path/to/file.ts — what changes and why

### Rust commands needed
- command_name — input/output types

### Security review
- List any sensitive operations in this task
- Confirm each one is handled in Rust, not JS

### Implementation steps
1. Step one (estimated: small/medium/large)
2. Step two
...

### Open questions
- Any ambiguities that need user confirmation before proceeding
```

### 5. Wait for user approval
- Do NOT write any code until the user confirms the plan
- If there are open questions, ask them now
