/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Home screen and daily command centre.
 *
 * Data:
 * Pulls from HistoryRepository, NutritionRepository, CheckInRepository and CardioRepository.
 *
 * Features:
 * - Daily companion summary
 * - Training intelligence
 * - Food, water, sleep, weight and movement stats
 * - Coach recommendation
 * - Weight trend
 *
 * Future:
 * AI-generated daily brief and richer personalised task list.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  Award,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Utensils,
  Waves,
} from "lucide-react";

import LineChartCard from "../components/LineChartCard";
import GamificationPanel from "../components/ui/GamificationPanel";
import { generateDailyCoachBrief } from "../services/engines/aiCoachEngine";
import { getAllTimePRs } from "../services/prEngine";
import {
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  NutritionRepository,
} from "../services/repositories/trackfitDataLayer";
import { getWeeklyTrainingSummary } from "../services/workoutSummaryEngine";
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

function getLatestCheckIn(checkIns) {
  return checkIns[0] || null;
}

function buildWeightTrend(checkIns) {
  const trend = checkIns
    .filter((checkIn) => toNumber(checkIn.weightKg ?? checkIn.weight) > 0)
    .slice(0, 7)
    .reverse()
    .map((checkIn) => ({
      date: new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(
        new Date(checkIn.date),
      ),
      weight: toNumber(checkIn.weightKg ?? checkIn.weight),
    }));

  return trend.length > 0
    ? trend
    : [
        { date: "Mon", weight: 105.0 },
        { date: "Tue", weight: 104.8 },
        { date: "Wed", weight: 104.6 },
        { date: "Thu", weight: 104.5 },
        { date: "Fri", weight: 104.2 },
      ];
}

export default function Dashboard() {
  const workoutHistory = useMemo(() => HistoryRepository.getAll(), []);
  const nutrition = useMemo(() => NutritionRepository.getAll(), []);
  const checkIns = useMemo(() => CheckInRepository.getAll(), []);
  const cardio = useMemo(() => CardioRepository.getAll(), []);

  const todaysMeals = useMemo(() => getTodayRecords(nutrition), [nutrition]);
  const todaysCardio = useMemo(() => getTodayRecords(cardio), [cardio]);
  const latestCheckIn = useMemo(() => getLatestCheckIn(checkIns), [checkIns]);

  const nutritionSummary = useMemo(
    () => buildNutritionSummary(todaysMeals),
    [todaysMeals],
  );
  const movementSummary = useMemo(
    () => buildMovementSummary(todaysCardio),
    [todaysCardio],
  );

  const weeklySummary = useMemo(
    () => getWeeklyTrainingSummary(workoutHistory),
    [workoutHistory],
  );
  const coachBrief = useMemo(
    () => generateDailyCoachBrief(workoutHistory),
    [workoutHistory],
  );
  const allTimePrs = useMemo(
    () => getAllTimePRs(workoutHistory),
    [workoutHistory],
  );

  const currentWeight = toNumber(
    latestCheckIn?.weightKg ?? latestCheckIn?.weight,
  );
  const water = toNumber(latestCheckIn?.waterL ?? latestCheckIn?.water);
  const sleep = toNumber(latestCheckIn?.sleepHours ?? latestCheckIn?.sleep);
  const proteinTarget = 185;
  const calorieTarget = 2600;

  const stats = [
    {
      icon: Flame,
      label: "Calories",
      value: nutritionSummary.calories.toLocaleString(),
      note: `${Math.max(0, calorieTarget - nutritionSummary.calories).toLocaleString()} left`,
      route: "/nutrition",
    },
    {
      icon: Utensils,
      label: "Protein",
      value: `${nutritionSummary.protein}g`,
      note: `${Math.max(0, proteinTarget - nutritionSummary.protein)}g to target`,
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
      note: sleep >= 7 ? "Solid" : "Needs work",
      route: "/checkin",
    },
    {
      icon: Scale,
      label: "Weight",
      value: currentWeight ? `${currentWeight.toFixed(1)}kg` : "Log it",
      note: latestCheckIn ? "Latest check-in" : "No check-in yet",
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

  const achievements = [
    { icon: Trophy, title: "12 day streak", detail: "Still showing up." },
    {
      icon: Award,
      title: `${weeklySummary.workouts} sessions`,
      detail: "This week locked in.",
    },
    {
      icon: ShieldCheck,
      title:
        nutritionSummary.protein >= proteinTarget
          ? "Protein nailed"
          : "Protein target active",
      detail:
        nutritionSummary.protein >= proteinTarget
          ? "Target hit today."
          : `${Math.max(0, proteinTarget - nutritionSummary.protein)}g still to go.`,
    },
  ];

  const weightData = buildWeightTrend(checkIns);

  return (
    <motion.div
      className="screen dashboard-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-hero">
        <div className="v4-hero__top">
          <div>
            <p className="eyebrow">Today</p>
            <h1>Haami</h1>
            <p>
              Training, food, movement and recovery are now feeding one screen.
            </p>
          </div>

          <div className="v4-ring" style={{ "--progress": "68%" }}>
            <div>
              <strong>68%</strong>
              <span>ready</span>
            </div>
          </div>
        </div>

        <div className="v4-goal-strip">
          <div>
            <span>Weight</span>
            <strong>
              {currentWeight ? `${currentWeight.toFixed(1)}kg` : "Log"}
            </strong>
          </div>
          <div>
            <span>Protein</span>
            <strong>{nutritionSummary.protein}g</strong>
          </div>
          <div>
            <span>Steps</span>
            <strong>
              {Math.round(movementSummary.steps).toLocaleString()}
            </strong>
          </div>
        </div>
      </section>

      <GamificationPanel />

      <section className="tf-intelligence-grid">
        <article>
          <Sparkles size={20} />
          <strong>{coachBrief.title}</strong>
          <span>{coachBrief.readiness.note}</span>
        </article>
        <article>
          <Dumbbell size={20} />
          <strong>{weeklySummary.workouts}</strong>
          <span>workouts this week</span>
        </article>
        <article>
          <Activity size={20} />
          <strong>
            {Math.round(weeklySummary.totalVolume).toLocaleString()}
          </strong>
          <span>kg lifted this week</span>
        </article>
        <article>
          <Trophy size={20} />
          <strong>{weeklySummary.totalPrs}</strong>
          <span>PRs this week</span>
        </article>
      </section>

      <section className="v4-today-card">
        <div className="v4-icon-bubble">
          <Dumbbell size={22} />
        </div>

        <div className="v4-today-card__main">
          <p className="eyebrow">Today&apos;s recommendation</p>
          <h2>{coachBrief.suggestedWorkout.title}</h2>
          <p>{coachBrief.reasons[0]}</p>
        </div>

        <Link className="v4-start-btn" to={coachBrief.suggestedWorkout.route}>
          Start <ChevronRight size={17} />
        </Link>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Daily targets</p>
          <h2>Today so far</h2>
        </div>
        <span>Live</span>
      </div>

      <section className="v4-stat-grid">
        {stats.map((item) => (
          <Link className="v4-stat-card" key={item.label} to={item.route}>
            <item.icon size={21} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.note}</small>
          </Link>
        ))}
      </section>

      <LineChartCard
        title="Weight Trend"
        data={weightData}
        dataKey="weight"
        unit="kg"
      />

      {allTimePrs.length > 0 && (
        <section className="tf-pr-strip">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Strength intelligence</p>
              <h2>Top estimated PRs</h2>
            </div>
          </div>

          {allTimePrs.slice(0, 3).map((pr) => (
            <article key={pr.exercise}>
              <strong>{pr.exercise}</strong>
              <span>
                {pr.set} - e1RM {pr.e1rm}kg
              </span>
            </article>
          ))}
        </section>
      )}

      <section className="v4-coach-card">
        <div>
          <p className="eyebrow">Daily brief</p>
          <h2>Your app is reading the pattern.</h2>
          <p>
            Food, movement, check-ins and workouts are now visible from the home
            screen.
          </p>
        </div>
        <Sparkles size={24} />
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Wins</p>
          <h2>Achievements</h2>
        </div>
      </div>

      <section className="v4-achievement-list">
        {achievements.map((item) => (
          <article className="v4-achievement-card" key={item.title}>
            <div className="v4-icon-bubble small">
              <item.icon size={18} />
            </div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="v4-mini-summary">
        <Activity size={18} />
        <span>Consistency beats perfect. Old-school truth, modern app.</span>
        <Target size={18} />
      </section>
    </motion.div>
  );
}
