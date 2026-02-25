## 2026-02-25 - Accessible Form Error Handling
**Learning:** Screen readers require programmatic association between inputs and their error messages to announce them effectively. Visual proximity is not enough.
**Action:** Link error messages to inputs using `aria-describedby` and `aria-invalid`, and ensure the error message has `role="alert"` or is a live region.
