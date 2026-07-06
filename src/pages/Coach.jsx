/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Deeper coaching and reasoning screen.
 *
 * Data:
 * Reads workout history, nutrition, movement and check-ins from repositories.
 *
 * Features:
 * - Next best move
 * - Training summary
 * - Last session
 * - Daily support signals
 * - Recommendation reasoning
 *
 * Future:
 * AI-generated natural language coach response using TrackFit engine output.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Beef,
  Brain,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  HelpCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Waves,
} from "lucide-react";

import { generateDailyCoachBrief } from "../services/engines/aiCoachEngine";
import {
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  NutritionRepository,
} from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

const today = new Date().toISOString().slice(0, 10);

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function getDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getTodayRecords(records) {
  return records.filter(
    (record) => getDateOnly(record.date || record.completedAt) === today,
  );
}

function buildNutritionSummary(meals) {
  return meals.reduce(
    (summary, meal) => ({
      calories: summary.calories + toNumber(meal.calories),
      protein: summary.protein + toNumber(meal.protein),
      carbs: summary.carbs + toNumber(meal.carbs),
      fats: summary.fats + toNumber(meal.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

function buildMovementSummary(cardio) {
  return cardio.reduce(
    (summary, session) => ({
      distanceKm:
        summary.distanceKm +
        toNumber(session.distanceKm ?? session.distance ?? session.km),
      steps: summary.steps + toNumber(session.steps),
      durationMin:
        summary.durationMin +
        toNumber(session.durationMin ?? session.duration ?? session.minutes),
    }),
    { distanceKm: 0, steps: 0, durationMin: 0 },
  );
}

export default function Coach() {
  const [showWhy, setShowWhy] = useState(false);

  const workoutHistory = useMemo(() => HistoryRepository.getAll(), []);
  const nutrition = useMemo(() => NutritionRepository.getAll(), []);
  const checkIns = useMemo(() => CheckInRepository.getAll(), []);
  const cardio = useMemo(() => CardioRepository.getAll(), []);

  const coach = useMemo(
    () => generateDailyCoachBrief(workoutHistory),
    [workoutHistory],
  );

  const todaysMeals = useMemo(() => getTodayRecords(nutrition), [nutrition]);
  const todaysCardio = useMemo(() => getTodayRecords(cardio), [cardio]);
  const latestCheckIn = checkIns[0] || null;

  const nutritionSummary = useMemo(
    () => buildNutritionSummary(todaysMeals),
    [todaysMeals],
  );

  const movementSummary = useMemo(
    () => buildMovementSummary(todaysCardio),
    [todaysCardio],
  );

  const water = toNumber(latestCheckIn?.waterL ?? latestCheckIn?.water);
  const sleep = toNumber(latestCheckIn?.sleepHours ?? latestCheckIn?.sleep);
  const proteinTarget = 185;
  const calorieTarget = 2600;

  const supportSignals = [
    {
      icon: Beef,
      label: "Protein",
      value: `${nutritionSummary.protein}g`,
      note:
        nutritionSummary.protein >= proteinTarget
          ? "Target hit"
          : `${Math.max(0, proteinTarget - nutritionSummary.protein)}g left`,
      route: "/nutrition",
    },
    {
      icon: Flame,
      label: "Calories",
      value: nutritionSummary.calories.toLocaleString(),
      note: `${Math.max(0, calorieTarget - nutritionSummary.calories).toLocaleString()} left`,
      route: "/nutrition",
    },
    {
      icon: Waves,
      label: "Water",
      value: `${water.toFixed(1)}L`,
      note: "Goal 4L",
      route: "/checkin",
    },
    {
      icon: Moon,
      label: "Sleep",
      value: `${sleep.toFixed(1)}h`,
      note: sleep >= 7 ? "Solid" : "Low",
      route: "/checkin",
    },
    {
      icon: Footprints,
      label: "Steps",
      value: Math.round(movementSummary.steps).toLocaleString(),
      note: `${movementSummary.distanceKm.toFixed(1)}km today`,
      route: "/cardio",
    },
  ];

  return (
    <main className="screen tf-coach-page">
      <section className="tf-coach-hero">
        <div>
          <p className="eyebrow">Training Coach</p>
          <h1>{coach.title}</h1>
          <p>{coach.readiness.note}</p>
        </div>

        <div
          className="tf-coach-score"
          style={{ "--score": `${coach.readiness.score}%` }}
        >
          <strong>{coach.readiness.score}</strong>
          <span>{coach.readiness.label}</span>
        </div>
      </section>

      <section className="tf-coach-action-card tf-next-move-card">
        <div className="tf-icon-disc">
          <Sparkles size={23} />
        </div>
        <div>
          <p className="eyebrow">Next best move</p>
          <h2>{coach.nextBestMove.title}</h2>
          <p>{coach.nextBestMove.detail}</p>
        </div>
        <Link to={coach.nextBestMove.route}>
          {coach.nextBestMove.action} <ChevronRight size={17} />
        </Link>
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Support signals</p>
            <h2>Today&apos;s fuel and recovery</h2>
          </div>
          <Brain size={22} />
        </div>

        <section className="v4-stat-grid">
          {supportSignals.map((item) => (
            <Link className="v4-stat-card" key={item.label} to={item.route}>
              <item.icon size={21} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </Link>
          ))}
        </section>
      </section>

      <section className="tf-coach-card tf-last-session-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Last session</p>
            <h2>{coach.lastSession.title}</h2>
          </div>
          <Dumbbell size={22} />
        </div>

        <p>{coach.lastSession.note}</p>

        <div className="tf-last-session-grid">
          <article>
            <Clock3 size={18} />
            <strong>{coach.lastSession.durationLabel}</strong>
            <span>{coach.lastSession.dateLabel}</span>
          </article>
          <article>
            <Activity size={18} />
            <strong>{coach.lastSession.sets}</strong>
            <span>sets</span>
          </article>
          <article>
            <TrendingUp size={18} />
            <strong>{coach.lastSession.volumeLabel}</strong>
            <span>volume</span>
          </article>
          <article>
            <Trophy size={18} />
            <strong>{coach.lastSession.prs}</strong>
            <span>PRs</span>
          </article>
        </div>
      </section>

      <section className="tf-coach-action-card compact">
        <div className="tf-icon-disc">
          <Dumbbell size={23} />
        </div>
        <div>
          <p className="eyebrow">Suggested workout</p>
          <h2>{coach.suggestedWorkout.title}</h2>
          <p>{coach.suggestedWorkout.reason}</p>
        </div>
        <Link to={coach.suggestedWorkout.route}>
          Start <ChevronRight size={17} />
        </Link>
      </section>

      <section className="tf-coach-metrics">
        <article>
          <TrendingUp size={20} />
          <strong>{coach.weeklySummary.workouts}</strong>
          <span>sessions</span>
        </article>
        <article>
          <Trophy size={20} />
          <strong>{coach.weeklySummary.totalPrs}</strong>
          <span>PR signals</span>
        </article>
        <article>
          <Target size={20} />
          <strong>{coach.benchGoal.percent}%</strong>
          <span>bench goal</span>
        </article>
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Weekly report</p>
            <h2>Training summary</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <p>{coach.weeklySummaryText}</p>
      </section>

      {coach.plateaus.length > 0 && (
        <section className="tf-coach-card warning">
          <div className="tf-section-title-row">
            <div>
              <p className="eyebrow">Plateau watch</p>
              <h2>Needs attention</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          {coach.plateaus.map((plateau) => (
            <article className="tf-coach-list-row" key={plateau.exercise}>
              <strong>{plateau.exercise}</strong>
              <span>{plateau.message}</span>
            </article>
          ))}
        </section>
      )}

      <section className="tf-coach-card">
        <button
          className="tf-why-button"
          onClick={() => setShowWhy((current) => !current)}
          type="button"
        >
          <HelpCircle size={20} />
          {showWhy ? "Hide reasoning" : "Why this recommendation?"}
        </button>

        {showWhy && (
          <div className="tf-why-list">
            {coach.reasons.map((reason) => (
              <p key={reason}>- {reason}</p>
            ))}
            <p>
              - Support signals checked: nutrition, movement, sleep and water.
            </p>
          </div>
        )}
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Recovery map</p>
            <h2>Muscles to watch</h2>
          </div>
          <Brain size={22} />
        </div>

        {coach.readiness.muscles.length === 0 ? (
          <p>
            Log workouts with exercises from the library and TrackFit will build
            your recovery map.
          </p>
        ) : (
          <div className="tf-recovery-list">
            {coach.readiness.muscles.map((item) => (
              <div key={item.muscle}>
                <span>{item.muscle.replaceAll("_", " ")}</span>
                <strong>{item.score}%</strong>
                <div>
                  <i style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
