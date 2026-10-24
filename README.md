# TrackFit

TrackFit is an **Android-native-first** fitness tracker with a companion web app. It runs a shared React/Vite interface inside a Capacitor Android shell and uses Kotlin for Health Connect and other device-specific capabilities. It's being built as an offline-first personal training platform. The goal is not just to log workouts, but to help the user understand what to train next, how to progress, and why a recommendation was made.

## Android app

The primary app is **TrackFit Native**, with workouts, Cardio, Nutrition, Dashboard and opt-in Health Connect step imports. The website remains a companion with the same TrackFit account. The installable debug build is automatically built on changes to the app in GitHub Actions (**TrackFit Native Android Preview**).

See [Native-first Android architecture and release plan](docs/NATIVE_FIRST_ANDROID.md) for build instructions, APK safety notes, remaining Android features and Play Store release gates. The current APK is for testing, not the final signed store app.

## Current milestone

**v0.7 — AI Coach Foundation**

TrackFit now includes the first version of its coaching layer:

- Exercise library and searchable exercise picker
- Workout logging with rest timers and workout history
- Previous workout targets and progression recommendations
- PR detection and estimated 1RM tracking
- Exercise detail pages and exercise analytics
- AI Workout Builder powered by the exercise library
- AI Coach page with readiness, weekly summary, plateau watch, recovery map and explainable recommendations

## Tech stack

- React
- Vite
- React Router
- Tailwind/shadcn-style UI components
- Recharts
- Vitest
- LocalStorage for offline-first data

## Development commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test:run
```

Use this full check before pushing:

```bash
npm run check
```

## Project structure

```text
src/
  components/     Reusable UI and layout components
  data/           Imported TrackFit exercise library
  pages/          App screens and routes
  services/       Workout intelligence, PRs, progression, AI coach logic
  styles/         Shared design tokens
scripts/          Exercise import tooling
public/           Static assets and attribution
```

## Documentation

- `ROADMAP.md` — release milestones and future direction
- `CHANGELOG.md` — version history
- `CONTRIBUTING.md` — workflow and coding standards
- `DEV_RULES.md` — practical development rules for this project

## Product direction

TrackFit is being built around one principle:

> Logging is useful. Coaching is valuable.

The long-term goal is to compete with workout loggers by making training decisions easier, clearer and more personalised.
