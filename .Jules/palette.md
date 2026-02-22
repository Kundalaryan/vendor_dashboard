## 2025-02-17 - [Accessible Form Errors]
**Learning:** Reusable `Input` and `Select` components lacked `aria-invalid` and `aria-describedby` attributes, meaning screen readers would announce errors only by chance or navigation, not immediately.
**Action:** Always verify `aria-invalid` and `aria-describedby` when creating or modifying form components. Use `useId` to reliably link inputs to their error messages.
