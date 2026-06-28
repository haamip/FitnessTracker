# Fitness Tracker Dev Rules

1. Mobile-first always.
2. Every page must be usable on phone before desktop.
3. Comment confusing code, not obvious code.
4. Explain variables, state, props, handlers, and calculations.
5. No massive files. Split reusable UI into components.
6. Test after every feature.
7. Commit after every working change.
8. No random redesigns during feature work.
9. Fix bugs before adding new features.
10. Build must pass before pushing to GitHub.
## v0.7 AI Coach development rules

- Keep coaching logic inside service files, not directly inside React components.
- Every recommendation should have a plain-English reason that can be shown in the UI.
- Treat recovery scores as training estimates, not medical advice.
- Add tests for PR, progression, recovery, AI builder and AI coach logic when those engines change.
- Before pushing, run:

```bash
npm run lint
npm run build
npm run test:run
```
