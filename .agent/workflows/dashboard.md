---
description: Dashboard agent — build the main vault dashboard including layout shell, entry list, modals, password generator, and hooks. Run after ui.md screens 1-3 are complete.
---

## Agent Identity

You are the **VaultKey Dashboard Agent**. Your job is to complete the main dashboard experience — everything the user sees after unlocking the vault. You build on top of the token system and routing already established by the UI agent.

Before starting any task, verify:
1. `src/styles/tokens.css` exists and is populated
2. `src/pages/DashboardPage.tsx` exists (even as a stub)
3. `src/store/vaultStore.ts` exists with the correct shape

If any of these are missing, stop and report to the user.

---

## Mandatory Pre-flight

1. Read `.antigravity/rules.md` Section 4 (file structure), Section 5 (design system), Section 6 (interactions), Section 7 (security constraints)
2. Read `src/styles/tokens.css` — memorize every token before writing any CSS
3. Read `src/store/vaultStore.ts` — understand current store shape before adding to it
4. Read `src/types/vault.ts` — know existing types before defining new ones

---

## Security Reminders (repeat from rules.md)

- `entries` in Zustand store = **metadata only** (id, category, title, is_favorite). No passwords, no usernames.
- `get_entry_detail` and `get_entry_password` results = used immediately, never stored in state.
- No `console.log` of any field from a decrypted entry.
- All `invoke()` results that contain sensitive data must flow directly into UI or clipboard — never into a ref, store, or module-level variable.

---

## Prompt 1 — Layout shell (AppShell, Sidebar, TopBar, StatusBar)

```
/plan

Read .antigravity/rules.md Section 5.4 (layout) and Section 5.5 (component specs for StatusBar).
Read src/store/vaultStore.ts to understand current store shape.
Read src/styles/tokens.css before writing any CSS.

Task: Build the main dashboard layout shell — AppShell, Sidebar, TopBar, StatusBar.

── AppShell.tsx ──
CSS grid layout, full window height:
  Row 1: title bar — 32px, data-tauri-drag-region attribute, draggable area
  Row 2: [sidebar 200px] [main flex-1] — this row takes remaining height
  Row 3: status bar — 28px

AppShell receives {children} and renders them in the main area.
DashboardPage.tsx should wrap its content in <AppShell>.

── Sidebar.tsx ──
Top section (logo header):
  - Purple square icon (20×20, --radius-sm, --color-brand bg, white lock icon)
  - "VaultKey" text (14px / 500 / --color-text-primary)
  - Vault meta line: "{count} items" (11px / --color-text-tertiary)

Navigation sections — two groups:
  Group 1 label "VAULT":
    - "All items" nav item with total count badge
    - "Favorites" nav item with favorites count badge

  Group 2 label "CATEGORIES":
    - Render dynamically from invoke('get_categories')
    - Each item: icon (Lucide) + category name + count badge
    - Category → Lucide icon mapping:
        Campus      → GraduationCap
        Google      → Globe
        Social Media → Users
        Finance     → CreditCard
        Dev Tools   → Terminal
        default     → Key

Nav item active state:
  - 2px solid left border: --color-brand
  - background: --color-brand-subtle
  - text: --color-text-primary / 500

Nav item inactive hover:
  - background: --color-bg-tertiary

Count badge:
  - margin-left: auto
  - background: --color-bg-tertiary
  - border-radius: 20px
  - padding: 1px 6px
  - font-size: 11px
  - color: --color-text-secondary

Bottom section (fixed to sidebar bottom):
  - "Password Generator" button — ghost style, full width, Lucide Shuffle icon
  - "Settings" icon button — Lucide Settings icon

On category click: vaultStore.setActiveCategory(category)
On "All items" click: vaultStore.setActiveCategory(null)

── TopBar.tsx ──
Height: 48px
Border bottom: 1px solid var(--color-border)
Layout: flex row, align-center, gap var(--space-3), padding 0 var(--space-4)

Left: search input
  - flex: 1
  - height: 36px
  - background: --color-bg-secondary
  - border: 1px solid --color-border
  - border-radius: --radius-md
  - Lucide Search icon inside left (color: --color-text-tertiary)
  - placeholder: "Search vault..."
  - onChange: vaultStore.setSearchQuery(value)

Right: "+ Add item" button
  - variant: primary
  - height: 36px
  - Lucide Plus icon + "Add item" text
  - onClick: opens EntryModal in add mode (lift state up to DashboardPage)

── StatusBar.tsx ──
Height: 28px
Background: --color-bg-secondary
Border top: 1px solid var(--color-border)
Layout: flex row, align-center, padding 0 var(--space-4)

Left side:
  - Dot (6×6px circle):
      green (#1D9E75) when isLocked === false
      red (--color-danger) when isLocked === true
  - Text: "Vault unlocked" or "Vault locked" (11px / --color-text-secondary)

Right side (margin-left: auto):
  - Lucide Clock icon (12px / --color-text-tertiary)
  - Timer text: "Auto-lock in M:SS" (11px)
  - Timer color: --color-text-tertiary normally
  - Timer color: --color-warning when lockWarning === true in store
  - Feed from useAutoLock hook

Wire StatusBar to useAutoLock hook — implement useAutoLock in this task too:

useAutoLock.ts:
  - Returns { timeRemaining: number }
  - Default: 300 seconds (5 minutes)
  - Resets on: mousemove, keydown, mousedown, touchstart on window
  - At 60s: vaultStore.setLockWarning(true)
  - At 0s: invoke('lock_vault') then vaultStore.setLocked(true)
  - useEffect cleanup: remove all event listeners
  - Only active when vaultStore.isLocked === false

Self-review before finishing:
- [ ] No hardcoded hex colors anywhere
- [ ] Font weight max 500
- [ ] Category list is dynamic (from invoke), not hardcoded
- [ ] useAutoLock cleans up listeners on unmount
- [ ] StatusBar timer color changes at ≤60s
```

---

## Prompt 2 — useClipboard hook

```
/plan

Read .antigravity/rules.md Section 6.1 (copy to clipboard behavior) fully.

Task: Implement src/hooks/useClipboard.ts.

Interface:
  Returns { copy: (text: string) => void, copied: boolean }

Behavior (strict — follow exactly):
  1. copy(text) called
  2. navigator.clipboard.writeText(text)
  3. Set copied = true
  4. After 1500ms: set copied = false
  5. After 30000ms (30s): navigator.clipboard.writeText('') — clear clipboard
  6. If copy() is called again before 30s timer fires:
     - Cancel the previous 30s clear timer
     - Start a new 30s timer from the new copy moment
  7. Cleanup: cancel both timers on unmount

Use useRef for timer IDs so they persist across renders without triggering re-renders.

This hook is used by:
  - EntryCard copy username button
  - EntryCard copy password button  
  - PasswordGenerator copy button

Do not implement clipboard clearing logic anywhere else — only here.
```

---

## Prompt 3 — EntryList and EntryCard

```
/plan

Read .antigravity/rules.md Section 5.5 (EntryCard specs) and Section 7 (security constraints).
Read src/types/vault.ts for VaultEntry type.
Read src/hooks/useClipboard.ts to understand the hook interface.

Task: Build EntryList.tsx and EntryCard.tsx.

── Types (add to src/types/vault.ts if not present) ──
interface VaultEntry {
  id: number;
  category: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
// Note: username and password are NOT in this type — fetched on demand only

── EntryList.tsx ──
Props: {
  onEdit: (entryId: number) => void;
  onDelete: (entryId: number) => void;
}

Reads from vaultStore:
  - entries: VaultEntry[]
  - searchQuery: string
  - activeCategory: string | null

Filtering logic:
  1. If activeCategory is not null: filter entries where entry.category === activeCategory
  2. If searchQuery is not empty: filter by title.toLowerCase().includes(query)
     (search across title only in list — username/notes not loaded yet)
  3. If activeCategory === 'Favorites': filter by is_favorite === true

Grouping: group filtered entries by category, render section header per group
  Section header: 11px / 500 / --color-text-tertiary / uppercase / letter-spacing 0.06em
  Margin top: var(--space-4) for each section except first

Empty states (per rules.md):
  - No entries at all: "Your vault is empty. Add your first entry with + Add item."
  - No search results: "No entries match "{searchQuery}"."
  - Favorites empty: "Star an entry to save it here."
  - Category empty: "No entries in this category yet."

── EntryCard.tsx ──
Props: {
  entry: VaultEntry;
  isSelected: boolean;
  onEdit: (entryId: number) => void;
  onDelete: (entryId: number) => void;
}

Height: 52px (min-height, don't clip content)
Layout: flex row, align-center, gap var(--space-3), padding 0 var(--space-3)
Border radius: --radius-lg
Cursor: pointer

States:
  Default: background transparent
  Hover: background --color-bg-secondary
  Selected: background --color-brand-subtle, border 1px solid --color-brand-border

Left: category icon box
  Size: 32×32px, border-radius: --radius-sm
  Colors per category (from rules.md Section 5.5 table):
    Campus      → bg #E8F0FE, icon color #1A73E8, icon: GraduationCap
    Google      → bg #FCE8E8, icon color #C5221F, icon: Globe
    Social Media → bg #F3E8FD, icon color #8430CE, icon: Users
    Finance     → bg #E8F5E9, icon color #1D9E75, icon: CreditCard
    Dev Tools   → bg #F0F0F0, icon color #3C3C3C, icon: Terminal
    default     → bg var(--color-bg-tertiary), icon color var(--color-text-secondary), icon: Key

Center (flex: 1, min-width: 0):
  Title: 13px / 500 / --color-text-primary, white-space: nowrap, overflow: hidden, text-overflow: ellipsis
  Subtitle: entry.category — 11px / 400 / --color-text-secondary

Right side — two parts:

  Part 1: masked password
    "••••••••" — 13px / monospace ('JetBrains Mono', 'Fira Code', monospace) / --color-text-tertiary
    margin-right: var(--space-2)

  Part 2: action buttons (opacity: 0 on card, opacity: 1 on card:hover)
    Three IconButton components, size 28×28px each:
    
    [Copy username] — Lucide User icon
      onClick: async () => {
        const detail = await invoke<VaultEntryDetail>('get_entry_detail', { entryId: entry.id });
        copy(detail.username); // useClipboard hook
      }
    
    [Copy password] — Lucide Copy icon (primary action, slightly more prominent)
      onClick: async () => {
        const password = await invoke<string>('get_entry_password', { entryId: entry.id });
        copy(password); // useClipboard hook — auto-clears after 30s
      }
    
    [Edit] — Lucide Pencil icon
      onClick: onEdit(entry.id)

  Star icon (top-right corner of card, 16px):
    Lucide Star — filled + --color-warning when is_favorite, outline + --color-text-tertiary when not
    onClick: async () => {
      await invoke('toggle_favorite', { entryId: entry.id });
      // refresh entries in store after toggle
    }

  Show copied state: when copied === true (from useClipboard),
    swap the copy icon temporarily to Lucide Check (--color-success)

Security self-review:
- [ ] No decrypted password or username stored in component state
- [ ] invoke results used immediately — not assigned to useState or useRef
- [ ] "••••••••" in list is hardcoded string, not actual password
```

---

## Prompt 4 — EntryModal (Add / Edit)

```
/plan

Read .antigravity/rules.md Section 5.5 (Modal specs) and Section 7 (security constraints).
Read src/types/vault.ts for existing types.
Read src/components/ui/Modal.tsx, Input.tsx, Button.tsx to understand available primitives.

Task: Build src/components/vault/EntryModal.tsx.

Props:
  mode: 'add' | 'edit'
  entryId?: number        — required when mode === 'edit'
  onClose: () => void
  onSaved: () => void     — called after successful save, parent refreshes entry list

── Modal structure ──
Use Modal.tsx primitive for overlay + card (480px wide, --radius-lg)

Header:
  Title: "Add entry" or "Edit entry" (16px / 500)
  X close button (top-right, 28×28px IconButton)

Body — form fields in this order:
  1. Category (select/dropdown)
     Options: Campus, Google, Social Media, Finance, Dev Tools, Other
     Default: "Campus" for new entries

  2. Title (Input, required)
     Placeholder: "e.g. Gmail Work Account"

  3. Username / Email (Input, required)
     Placeholder: "username or email"

  4. Password field row:
     - Input (type password, show/hide toggle on right)
     - "Generate" text button (link style, --color-brand, 11px) below the input
       onClick: toggle inline PasswordGenerator visibility

  5. Inline PasswordGenerator (hidden by default, shown when "Generate" clicked)
     mode="inline"
     onSelect={(password) => setFormPassword(password)}

  6. Website URL (Input, optional)
     Placeholder: "https://"
     type="url"

  7. Notes (textarea, optional, 3 rows)
     Placeholder: "Additional notes..."

  For edit mode — on modal mount:
    const detail = await invoke<VaultEntryDetail>('get_entry_detail', { entryId })
    Pre-fill: category, title, username, url, notes from detail
    Password field: show placeholder "••••••••" — user must type new password to change it
    If password field left as placeholder on save → fetch separately and reuse:
      const existingPw = await invoke<string>('get_entry_password', { entryId })
    Use existingPw only at the moment of invoke('update_entry') — do not store in state beyond that

Footer:
  Left: "Cancel" ghost button → onClose()
  Right: "Save entry" primary button → handleSave()

── handleSave logic ──
Add mode:
  await invoke('add_entry', { category, title, username, password, url, notes })
  → onSaved() → onClose()

Edit mode:
  let pw = formPassword (if user typed a new one)
  if pw === '' or pw is the placeholder: 
    pw = await invoke<string>('get_entry_password', { entryId }) // fetch only at save moment
  await invoke('update_entry', { id: entryId, category, title, username, password: pw, url, notes })
  → onSaved() → onClose()

Error handling:
  Show inline error below the failing field
  Never surface raw Rust error strings to the user — map to friendly messages

Security self-review:
- [ ] Fetched entry detail only lives in local form state — not in Zustand
- [ ] Existing password fetched only at save moment — not on modal open
- [ ] No sensitive field logged to console
```

---

## Prompt 5 — DeleteConfirm modal

```
/plan

Read .antigravity/rules.md Section 5.5 (Modal specs).
Read src/components/ui/Modal.tsx, Button.tsx.

Task: Build src/components/vault/DeleteConfirm.tsx.

Props:
  entryTitle: string
  entryId: number
  onClose: () => void
  onDeleted: () => void

Modal: 360px wide, --radius-lg, same overlay as other modals

Layout (centered, column):
  - Trash icon in red circle (40×40px circle, --color-danger bg at 15% opacity, --color-danger icon, 20px Lucide Trash2)
  - Title: "Delete entry?" (16px / 500 / --color-text-primary)
  - Body: "This will permanently delete {entryTitle}. This action cannot be undone." (13px / --color-text-secondary, centered)
  
Footer (right-aligned):
  - "Cancel" ghost button → onClose()
  - "Delete" danger button → handleDelete()

handleDelete:
  await invoke('delete_entry', { entryId })
  → onDeleted() → onClose()

No confirmation typing required — the modal itself is the confirmation step.
Pressing Escape = cancel (handled by Modal primitive).
```

---

## Prompt 6 — PasswordGenerator

```
/plan

Read .antigravity/rules.md Section 5.5 (Password Generator specs) and Section 7 (security).
Read src/hooks/useClipboard.ts.

Task: Build src/components/vault/PasswordGenerator.tsx.

Props:
  mode: 'standalone' | 'inline'
  onSelect?: (password: string) => void   — only used in inline mode

── Controls (in order) ──

1. Length row:
   Label: "Length: {length}" (13px / 500 / --color-text-primary)
   Slider: input[type=range] min=8 max=64 step=1 default=20
   Style slider track: --color-brand, thumb: --color-brand

2. Checkbox group (2×2 grid or 1 column):
   - [x] Uppercase (A–Z)
   - [x] Lowercase (a–z)  
   - [x] Numbers (0–9)
   - [x] Symbols (!@#$...)
   All checked by default.
   Disable "Generate" if all four are unchecked — show inline warning instead.

3. Generated password output:
   - Input, read-only
   - font-family: 'JetBrains Mono', 'Fira Code', monospace
   - font-size: 13px
   - background: --color-bg-secondary
   - Full width

4. Button row:
   - Regenerate: IconButton with Lucide RefreshCw icon
   - Copy: primary Button "Copy password" (standalone mode)
     OR "Use this password" (inline mode) — calls onSelect(password)

── Generation logic ──
On mount: call generatePassword() immediately
On any control change: call generatePassword() automatically

generatePassword():
  const result = await invoke<string>('generate_password', {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols
  })
  setPassword(result)

NEVER generate password in JavaScript — always invoke Rust command.

Copy behavior (standalone mode):
  copy(password) from useClipboard hook
  Show Lucide Check on copy icon for 1500ms

Inline mode:
  "Use this password" button → onSelect(password) → parent fills password field
  No copy button in inline mode

Security check:
- [ ] Password generated exclusively via invoke('generate_password')
- [ ] No Math.random() or window.crypto used in this component
```

---

## Prompt 7 — Wire DashboardPage

```
/plan

Read src/components/layout/AppShell.tsx, Sidebar.tsx, TopBar.tsx, StatusBar.tsx.
Read src/components/vault/EntryList.tsx, EntryModal.tsx, DeleteConfirm.tsx.
Read src/store/vaultStore.ts.

Task: Wire everything together in DashboardPage.tsx.

DashboardPage is the top-level coordinator. It:
1. Wraps content in <AppShell>
2. On mount: loads entries via invoke('get_entries') → vaultStore.setEntries(entries)
3. Manages modal open/close state:
   - showAddModal: boolean
   - showEditModal: boolean  
   - editingEntryId: number | null
   - showDeleteModal: boolean
   - deletingEntry: { id: number, title: string } | null

4. Renders:
   <AppShell>
     <Sidebar onAddClick={() => setShowAddModal(true)} />
     <main>
       <TopBar onAddClick={() => setShowAddModal(true)} />
       <EntryList
         onEdit={(id) => { setEditingEntryId(id); setShowEditModal(true); }}
         onDelete={(id, title) => { setDeletingEntry({id, title}); setShowDeleteModal(true); }}
       />
     </main>
     <StatusBar />

     {showAddModal && (
       <EntryModal
         mode="add"
         onClose={() => setShowAddModal(false)}
         onSaved={refreshEntries}
       />
     )}
     {showEditModal && editingEntryId && (
       <EntryModal
         mode="edit"
         entryId={editingEntryId}
         onClose={() => { setShowEditModal(false); setEditingEntryId(null); }}
         onSaved={refreshEntries}
       />
     )}
     {showDeleteModal && deletingEntry && (
       <DeleteConfirm
         entryId={deletingEntry.id}
         entryTitle={deletingEntry.title}
         onClose={() => { setShowDeleteModal(false); setDeletingEntry(null); }}
         onDeleted={refreshEntries}
       />
     )}
   </AppShell>

refreshEntries():
  const fresh = await invoke<VaultEntry[]>('get_entries')
  vaultStore.setEntries(fresh)

Global keyboard shortcuts (useEffect in DashboardPage):
  Ctrl/Cmd+N → setShowAddModal(true)
  Ctrl/Cmd+F → focus search input (via ref on TopBar input)
  Ctrl/Cmd+L → invoke('lock_vault') → vaultStore.setLocked(true)
  Ctrl/Cmd+G → open password generator modal/panel
  Escape → close any open modal

After implementing: do a full walkthrough — can you add an entry, see it in the list, copy the password, edit it, and delete it?
```
