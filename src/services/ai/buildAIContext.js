import {
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  NutritionRepository,
  SavedWorkoutRepository,
} from "../repositories/trackfitDataLayer";
import { describeShift, getOperationalDate, getShiftMode } from "../shift/shiftModeService";

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const average = (rows, selector) => rows.length
  ? Math.round((rows.reduce((sum, row) => sum + number(selector(row)), 0) / rows.length) * 10) / 10
  : 0;

function withinDays(value, days) {
  const timestamp = new Date(value || 0).getTime();
  return timestamp >= Date.now() - days * 86400000;
}

export function buildTrackFitAIContext() {
  const mode = getShiftMode();
  const operationalDate = getOperationalDate(new Date(), mode);
  const history = HistoryRepository.getAll();
  const checkIns = CheckInRepository.getAll();
  const cardio = CardioRepository.getAll();
  const nutrition = NutritionRepository.getAll();
  const plans = SavedWorkoutRepository.getAll();

  const recentHistory = history.filter((item) => withinDays(item.completedAt || item.date, 14)).slice(0, 12);
  const recentCheckIns = checkIns.filter((item) => withinDays(item.date, 14)).slice(0, 14);
  const recentCardio = cardio.filter((item) => withinDays(item.completedAt || item.date, 14)).slice(0, 14);
  const recentNutrition = nutrition.filter((item) => withinDays(item.createdAt || item.date, 14));
  const todayMeals = nutrition.filter((item) => item.date === operationalDate);

  return {
    generatedAt: new Date().toISOString(),
    shift: describeShift(mode),
    operationalDate,
    training: {
      completedLast14Days: recentHistory.length,
      recentSessions: recentHistory.map((item) => ({
        title: item.title,
        completedAt: item.completedAt || item.date,
        durationSeconds: number(item.durationSeconds ?? item.seconds),
        volume: number(item.volume ?? item.totalVolume),
        completedSets: number(item.completedSets ?? item.doneSets),
        prs: item.prs || [],
        notes: item.notes || "",
      })),
      availablePlans: plans.slice(0, 8).map((item) => ({ id: item.id, title: item.title || item.name, exerciseCount: item.exercises?.length || 0 })),
    },
    recovery: {
      checkInDays: recentCheckIns.length,
      averageSleepHours: average(recentCheckIns, (item) => item.sleepHours ?? item.sleep),
      averageEnergy: average(recentCheckIns, (item) => item.energy),
      averageWaterLitres: average(recentCheckIns, (item) => item.waterL ?? item.water),
      latest: recentCheckIns[0] || null,
    },
    nutrition: {
      operationalDate,
      today: {
        calories: todayMeals.reduce((sum, item) => sum + number(item.calories), 0),
        proteinG: todayMeals.reduce((sum, item) => sum + number(item.protein), 0),
        carbsG: todayMeals.reduce((sum, item) => sum + number(item.carbs), 0),
        fatsG: todayMeals.reduce((sum, item) => sum + number(item.fats), 0),
        meals: todayMeals.map((item) => ({ type: item.type, name: item.name, calories: number(item.calories), proteinG: number(item.protein) })),
      },
      averageCalories14Days: average(recentNutrition, (item) => item.calories),
      averageProteinG14Days: average(recentNutrition, (item) => item.protein),
    },
    cardio: {
      sessionsLast14Days: recentCardio.length,
      recentSessions: recentCardio.map((item) => ({ type: item.type || item.activity, duration: number(item.durationMinutes ?? item.duration), distance: number(item.distance), date: item.completedAt || item.date })),
    },
  };
}
