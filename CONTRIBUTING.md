# Contributing to TrackFit

## Development workflow

1. Start from the latest pushed branch.
2. Make focused changes by feature or milestone.
3. Run the full check:

```bash
npm run lint
npm run build
npm run test:run
```

4. Test the main user flow manually.
5. Commit with a clear message.
6. Push to `ui-app-shell`.

## Code style

- Prefer complete file replacements for large refactors.
- Keep UI components readable and focused.
- Keep business logic in `src/services/` where it can be tested.
- Add comments for non-obvious logic, especially AI, progression, recovery and PR calculations.
- Do not over-comment obvious JSX or simple variable assignments.

## Architecture rules

- The exercise library is the single source of truth for exercises.
- Workout intelligence should read completed workout history, not hardcoded examples.
- AI recommendations must be explainable.
- Offline-first localStorage remains the default until cloud sync is intentionally added.

## Testing rules

- Pure logic in `src/services/` should have unit tests.
- UI tests should focus on smoke tests and critical user flows.
- Every new engine should have at least one basic test.
