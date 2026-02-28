## 2026-02-25 - Accessible Form Error Handling
**Learning:** Screen readers require programmatic association between inputs and their error messages to announce them effectively. Visual proximity is not enough.
**Action:** Link error messages to inputs using `aria-describedby` and `aria-invalid`, and ensure the error message has `role="alert"` or is a live region.

## 2026-02-25 - Custom Toggle Switches Accessibility
**Learning:** Custom toggle switches built with generic elements like `<button>` and `<span>` are completely opaque to screen readers and keyboard users unless explicitly configured. `focus:outline-none` removes default keyboard focus indicators entirely.
**Action:** Always add `role="switch"`, `aria-checked`, and a descriptive `aria-label` to custom toggles. When removing default outlines, strictly replace them with a `focus-visible:ring` utility to ensure the element remains keyboard navigable.
