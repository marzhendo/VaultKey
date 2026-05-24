---
description: Polish agent — improve UX with loading states, error boundaries, animations, and dark mode persistence. Run after full security audit passes.
---

## Agent Identity

You are the **VaultKey Polish Agent**. Your job is to improve the user experience without touching any security-critical code. You do not modify: `src-tauri/src/crypto/`, `src-tauri/src/commands/auth.rs` (except minor UI feedback), or any Argon2/AES logic.

Before starting any task:
1. Read `.antigravity/rules.md` Section 5 (design system) and Section 6 (interactions)
2. Read `src/styles/tokens.css` — all new visual states must use existing tokens
3. Read `src/store/vaultStore.ts` — add new UI state here, not in component local state

---

## Prompt 1 — Loading states

```
/plan

Read .antigravity/rules.md Section 5.2 (color tokens) and Section 5.3 (typography).
Read src/store/vaultStore.ts for current store shape.

Task: Add loading states to all async invoke() operations.

── 1A. Global loading indicator in vaultStore ──
Add to VaultStore interface:
  isLoading: boolean
  loadingMessage: string | null
  setLoading: (loading: boolean, message?: string) => void

── 1B. Skeleton loader for EntryList ──
File: src/components/vault/EntryList.tsx

When isLoading === true and entries.length === 0:
  Show 4 skeleton EntryCard placeholders instead of empty state.

Skeleton card structure (same 52px height as EntryCard):
  - Left: 32×32px rounded square, background: --color-bg-tertiary
  - Center: two bars
      Title bar: 120px wide × 12px tall, --color-bg-tertiary, --radius-sm
      Subtitle bar: 80px wide × 10px tall, --color-bg-tertiary, --radius-sm
  - Right: 60px wide × 10px tall bar, --color-bg-tertiary, --radius-sm

Animation: CSS keyframe pulse
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  Apply to all skeleton bars.

── 1C. Button loading state ──
File: src/components/ui/Button.tsx

Add isLoading prop: boolean (default false)
When isLoading === true:
  - Show Lucide Loader2 icon (16px) with spin animation instead of children
  - Disable the button (pointer-events: none, opacity: 0.6)
  - Keep button dimensions identical — no layout shift

CSS for spin:
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  animation: spin 0.8s linear infinite;

Apply isLoading to:
  - "Unlock vault" button in LoginPage during invoke('unlock_vault')
  - "Save entry" button in EntryModal during invoke('add_entry') / invoke('update_entry')
  - "Delete" button in DeleteConfirm during invoke('delete_entry')
  - "Next Step" / "Confirm" buttons in SetupPage during invoke('setup_vault')

── 1D. TopBar loading indicator ──
File: src/components/layout/TopBar.tsx

When isLoading === true:
  Show a 2px progress bar at the very bottom of TopBar
  Background: --color-brand
  Animated: slide from left 0% to right 100% over 1s, then loop
  
  @keyframes progress-slide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

Self-review:
- [ ] Skeleton cards are exactly 52px tall — same as real EntryCard
- [ ] Button dimensions don't change when isLoading switches
- [ ] No new hardcoded colors — all use var(--token-name)
- [ ] Loading state clears after invoke() resolves or rejects
```

---

## Prompt 2 — Error boundaries and toast notifications

```
/plan

Read .antigravity/rules.md Section 5.2 (semantic color tokens: --color-danger, --color-success, --color-warning, --color-info).
Read src/store/vaultStore.ts.

Task: Add error boundary and toast notification system.

── 2A. Toast store ──
Add to vaultStore.ts (or create separate src/store/toastStore.ts):

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // ms, default 3000
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

Helper functions (export from toastStore):
  toast.success(message: string, duration?: number)
  toast.error(message: string, duration?: number)
  toast.warning(message: string, duration?: number)
  toast.info(message: string, duration?: number)

── 2B. ToastContainer component ──
File: src/components/ui/ToastContainer.tsx

Position: fixed, bottom-right corner
  bottom: var(--space-4)
  right: var(--space-4)
  z-index: 1000
  display: flex, flex-direction: column-reverse, gap: var(--space-2)

Individual Toast item:
  min-width: 280px, max-width: 380px
  padding: var(--space-3) var(--space-4)
  border-radius: --radius-lg
  display: flex, align-items: center, gap: var(--space-2)
  font-size: 13px

  Colors per type:
    success → background: #E8F5E9, border-left: 3px solid --color-success, icon: Lucide Check (--color-success)
    error   → background: #FEECEC, border-left: 3px solid --color-danger,  icon: Lucide X (--color-danger)
    warning → background: #FFF3E0, border-left: 3px solid --color-warning, icon: Lucide AlertTriangle (--color-warning)
    info    → background: #E3F2FD, border-left: 3px solid --color-info,    icon: Lucide Info (--color-info)

  Right side: X dismiss button (16px, --color-text-tertiary)

  Auto-dismiss: after toast.duration ms, call removeToast(id)
  
  Entry animation:
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    animation: toast-in 0.2s ease-out;

Render <ToastContainer /> inside App.tsx at root level.

── 2C. Replace all inline error states with toasts ──
Replace current error handling in these files:

EntryModal.tsx:
  catch block → toast.error('Failed to save entry. Please try again.')
  
DeleteConfirm.tsx:
  catch block → toast.error('Failed to delete entry.')

LoginPage.tsx:
  failed unlock → toast.error('Incorrect master password.')
  (keep inline error below input too for accessibility)

SetupPage.tsx:
  failed setup → toast.error('Failed to create vault. Please try again.')

EntryCard.tsx copy actions:
  success copy → toast.success('Copied to clipboard')
  clipboard cleared (after 30s) → toast.info('Clipboard cleared')

toggle_favorite success:
  → toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites')

── 2D. Error boundary ──
File: src/components/ErrorBoundary.tsx

Class component (one of the rare acceptable cases — React requires class for error boundaries):

  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  >

  getDerivedStateFromError(error): set hasError = true, store error

  Fallback UI when hasError:
    Centered in window
    Lucide ShieldAlert icon (48px, --color-danger)
    Title: "Something went wrong" (16px / 500)
    Body: "VaultKey encountered an unexpected error. Your vault data is safe." (13px / --color-text-secondary)
    Button: "Restart app" → calls window.location.reload()
    Small text below: error.message (11px / --color-text-tertiary / monospace)

Wrap <App /> with <ErrorBoundary> in main.tsx.

Self-review:
- [ ] ToastContainer doesn't cause layout shift on other elements
- [ ] Toast auto-dismisses correctly
- [ ] Error boundary catches without exposing stack traces to user
- [ ] All toast backgrounds use var() tokens or well-defined semantic colors
```

---

## Prompt 3 — Modal and transition animations

```
/plan

Read .antigravity/rules.md Section 2.1 (no decorative elements) and Section 5.1 (visual direction).

Task: Add functional micro-animations. These must be subtle and purposeful — not decorative.
Rule: Every animation must serve a UX purpose (orient the user, confirm an action, or indicate state change).
No animations purely for aesthetics.

── 3A. Modal enter/exit animation ──
File: src/components/ui/Modal.tsx

Add isOpen prop to Modal component.
Keep Modal mounted but animate in/out:

Overlay:
  @keyframes overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes overlay-out { from { opacity: 1; } to { opacity: 0; } }
  animation duration: 150ms, ease

Modal card:
  @keyframes modal-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modal-out {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(8px) scale(0.98); }
  }
  animation duration: 150ms, ease

Use a closing state (isClosing: boolean) to play exit animation before unmounting:
  1. onClose() called → setIsClosing(true)
  2. After 150ms → actually unmount (call parent's close handler)

── 3B. EntryCard hover transition ──
File: src/components/vault/EntryCard.tsx

Add to card CSS:
  transition: background-color 100ms ease;

Add to action buttons:
  transition: opacity 100ms ease;

These are already functional (show/hide on hover) — just make them smooth.

── 3C. Sidebar nav item transition ──
File: src/components/layout/Sidebar.tsx

Add to nav items:
  transition: background-color 100ms ease, color 100ms ease;

── 3D. Copy icon → checkmark swap ──
File: src/components/vault/EntryCard.tsx

Already handled by useClipboard (copied state).
Ensure the icon swap has a small fade:
  transition: opacity 80ms ease;
  When swapping: briefly set opacity 0, swap icon, set opacity 1

── 3E. Lock overlay animation ──
When vault auto-locks (vaultStore.isLocked becomes true from unlocked):
  Show a full-window overlay with fade-in:
  @keyframes lock-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  animation: lock-fade 200ms ease;
  
  Overlay content:
    VaultKey logo icon (center)
    "VaultKey locked" text (16px / 500)
    "Enter your master password to continue" (13px / --color-text-secondary)
    Password input + Unlock button (same as LoginPage style)
    
  This renders over the dashboard — user doesn't navigate away,
  just unlocks inline and vault continues from where they left off.

Self-review:
- [ ] All animations under 200ms — no slow decorative effects
- [ ] Modal exit animation plays before unmount
- [ ] Lock overlay renders over dashboard, not navigates away
- [ ] No transform or animation on layout-critical elements that could cause reflow
```

---

## Prompt 4 — Dark mode persistence

```
/plan

Read .antigravity/rules.md Section 5.2 (dark mode tokens: [data-theme="dark"]).
Read src/store/vaultStore.ts.

Task: Persist dark mode preference across app restarts using Tauri's store plugin.

── 4A. Add theme to vaultStore ──
Add to VaultStore:
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void

── 4B. Apply theme to document root ──
In App.tsx, add useEffect:
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

This makes [data-theme="dark"] CSS selector in tokens.css activate.

── 4C. Persist preference via Tauri ──
Use Tauri's fs API to read/write a simple JSON config file:
  File location: {app_data_dir}/config.json
  Content: { "theme": "light" | "dark" }

Add two new Rust commands in src-tauri/src/commands/:
  File: src/commands/config.rs

  get_theme() -> Result<String, String>
    Read {app_data_dir}/config.json
    Parse JSON, return theme value
    If file doesn't exist: return "light" (default)

  set_theme(theme: String) -> Result<(), String>
    Validate theme is "light" or "dark" — return Err otherwise
    Write { "theme": theme } to {app_data_dir}/config.json

Register both in main.rs invoke_handler.

── 4D. Load theme on app start ──
In App.tsx, on mount:
  const savedTheme = await invoke<string>('get_theme')
  vaultStore.setTheme(savedTheme as 'light' | 'dark')

── 4E. Theme toggle in Sidebar ──
File: src/components/layout/Sidebar.tsx

The THEME section at the bottom already exists visually.
Wire it up:

  Left: "THEME" label (11px uppercase / --color-text-tertiary)
  Right: Settings icon button (Lucide Settings) — already there

  Replace Settings icon with a toggle:
    Sun icon (Lucide Sun) when dark mode is active → click switches to light
    Moon icon (Lucide Moon) when light mode is active → click switches to dark
  
  onClick:
    vaultStore.toggleTheme()
    invoke('set_theme', { theme: newTheme })

  Smooth transition on the icon swap:
    transition: opacity 100ms ease

── 4F. System preference detection (bonus) ──
On first launch (no config.json exists yet):
  Check window.matchMedia('(prefers-color-scheme: dark)').matches
  If true: set theme to 'dark' automatically
  Save to config.json via set_theme command

Self-review:
- [ ] [data-theme="dark"] selector activates correctly on document root
- [ ] Theme persists after app restart (verify by restarting the app)
- [ ] set_theme validates input — cannot write arbitrary strings to config.json
- [ ] System preference detected only on first launch, not every launch
- [ ] New Rust commands registered in main.rs invoke_handler
```

---

## Prompt 5 — Empty states and micro-copy

```
/plan

Read .antigravity/rules.md Section 7 (empty states table) and Section 5.3 (typography).

Task: Polish all empty states and improve micro-copy throughout the app.

── 5A. Empty state component ──
File: src/components/ui/EmptyState.tsx

Props:
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }

Layout: centered column, gap var(--space-3)
  Icon: 40px, --color-text-tertiary, no background circle
  Title: 14px / 500 / --color-text-secondary
  Description: 13px / 400 / --color-text-tertiary (optional)
  Action button: ghost variant (optional)

── 5B. Wire EmptyState in EntryList ──
Replace raw text empty states with EmptyState component:

No entries at all:
  icon: Inbox
  title: "Your vault is empty"
  description: "Add your first entry to get started."
  action: { label: "+ Add item", onClick: onAddClick }

No search results:
  icon: SearchX
  title: 'No results for "{searchQuery}"'
  description: "Try a different search term."

Favorites empty:
  icon: Star
  title: "No favorites yet"
  description: "Star an entry to save it here."

Category empty:
  icon: FolderOpen
  title: "Nothing in {activeCategory}"
  description: "Add an entry to this category."

── 5C. Micro-copy improvements ──

SetupPage warning text — make more human:
  Current: "If you forget your master password, your data cannot be recovered. There is no reset option."
  New: "Choose a password you'll remember. If you forget it, there's no way to recover your data — this is by design."

LoginPage tagline:
  Current: (whatever it is)
  New: "Your passwords, yours alone."

StatusBar locked text:
  Current: "Vault locked"
  New: "Locked — enter master password to continue"

Copy success toast:
  "Password copied — clears from clipboard in 30s"
  (more informative than just "Copied to clipboard")

Auto-lock warning (when timer turns orange):
  Add toast.warning("Vault locking soon — move your mouse to stay active")
  Show only once per session, not every time timer reaches 60s

── 5D. Password strength indicator polish ──
File: src/pages/SetupPage.tsx

Current: basic strength levels
Improve strength bar:

  Bar: full-width, 4px tall, --radius-sm, background: --color-bg-tertiary
  Fill: animated width transition (300ms ease)
  
  Strength levels and colors:
    Weak (1/4)      → width: 25%, background: --color-danger
    Fair (2/4)      → width: 50%, background: --color-warning
    Strong (3/4)    → width: 75%, background: --color-info
    Very strong (4/4) → width: 100%, background: --color-success

  Label below bar: "Weak" / "Fair" / "Strong" / "Very strong"
  Color matches bar color.
  
  Strength criteria (count how many are true):
    1. length ≥ 12
    2. has uppercase AND lowercase
    3. has at least one number
    4. has at least one symbol (!@#$%^&*...)
  
  Score 0-1 → Weak, 2 → Fair, 3 → Strong, 4 → Very strong

Self-review:
- [ ] EmptyState component is reusable — no hardcoded content inside it
- [ ] Action button in EmptyState is optional (renders only when prop provided)
- [ ] Strength bar width transition is smooth (300ms)
- [ ] Auto-lock warning toast shows only once per session
```
