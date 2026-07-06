/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Daily nutrition tracking surface.
 *
 * Data:
 * Uses local component state for MVP display data.
 * Next pass should move meals into a NutritionRepository.
 *
 * Features:
 * - Daily calorie and macro summary
 * - Quick meal logging form
 * - Recent meal list
 * - Coach note for nutrition patterns
 *
 * Future:
 * Favourite meals, food library, barcode scan, photo meal import, nutrition engine.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  Beef,
  Flame,
  GlassWater,
  Plus,
  Salad,
  Save,
  Sparkles,
  Utensils,
} from "lucide-react";

import Button from "../components/ui/Button";
import "./TrackFitScreens.css";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Shake"];

const starterMeals = [
  {
    id: "meal-1",
    type: "Breakfast",
    name: "Oats, protein and banana",
    calories: 520,
    protein: 42,
    carbs: 62,
    fats: 12,
  },
  {
    id: "meal-2",
    type: "Lunch",
    name: "Chicken, rice and veg",
    calories: 680,
    protein: 58,
    carbs: 72,
    fats: 16,
  },
];

const initialForm = {
  type: "Breakfast",
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

export default function Nutrition() {
  const [meals, setMeals] = useState(starterMeals);
  const [form, setForm] = useState(initialForm);

  const totals = useMemo(
    () =>
      meals.reduce(
        (summary, meal) => ({
          calories: summary.calories + meal.calories,
          protein: summary.protein + meal.protein,
          carbs: summary.carbs + meal.carbs,
          fats: summary.fats + meal.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      ),
    [meals],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newMeal = {
      id: `meal-${Date.now()}`,
      type: form.type,
      name: form.name || "Quick meal",
      calories: Math.round(toNumber(form.calories)),
      protein: Math.round(toNumber(form.protein)),
      carbs: Math.round(toNumber(form.carbs)),
      fats: Math.round(toNumber(form.fats)),
    };

    setMeals((current) => [newMeal, ...current]);
    setForm(initialForm);
  }

  return (
    <motion.div
      className="screen checkin-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-checkin-hero">
        <div>
          <p className="eyebrow">Nutrition</p>
          <h1>Fuel</h1>
          <p>
            Track calories, protein and the basics without making food a maths
            exam.
          </p>
        </div>

        <div className="v4-checkin-date">
          <span>Food</span>
          <strong>{meals.length}</strong>
        </div>
      </section>

      <section className="v4-check-grid">
        <article className="v4-check-card">
          <Flame size={21} />
          <strong>{totals.calories}</strong>
          <span>Calories</span>
          <small>Daily total</small>
        </article>

        <article className="v4-check-card">
          <Beef size={21} />
          <strong>{totals.protein}g</strong>
          <span>Protein</span>
          <small>{Math.max(0, 185 - totals.protein)}g to target</small>
        </article>

        <article className="v4-check-card">
          <Apple size={21} />
          <strong>{totals.carbs}g</strong>
          <span>Carbs</span>
          <small>Training fuel</small>
        </article>

        <article className="v4-check-card">
          <GlassWater size={21} />
          <strong>{totals.fats}g</strong>
          <span>Fats</span>
          <small>Hormones and recovery</small>
        </article>
      </section>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Log meal</p>
          <h2>Add food</h2>
          <p>Keep it rough and useful. Perfect tracking can come later.</p>
        </div>

        <label>
          Meal type
          <select
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            {mealTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          Meal name
          <input
            placeholder="Chicken, rice and veg"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </label>

        <label>
          Calories
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={form.calories}
            onChange={(event) => updateField("calories", event.target.value)}
          />
        </label>

        <label>
          Protein grams
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={form.protein}
            onChange={(event) => updateField("protein", event.target.value)}
          />
        </label>

        <label>
          Carbs grams
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={form.carbs}
            onChange={(event) => updateField("carbs", event.target.value)}
          />
        </label>

        <label>
          Fats grams
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={form.fats}
            onChange={(event) => updateField("fats", event.target.value)}
          />
        </label>

        <Button className="v4-save-checkin" type="submit">
          <Plus size={17} />
          Add meal
        </Button>
      </form>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Meals logged</h2>
        </div>
        <span>{meals.length} meals</span>
      </div>

      <section className="v4-recovery-list">
        {meals.map((meal) => (
          <article className="v4-recovery-row" key={meal.id}>
            <div className="v4-icon-bubble small">
              <Utensils size={18} />
            </div>

            <div>
              <strong>{meal.name}</strong>
              <span>
                {meal.type} - {meal.calories} cal - {meal.protein}g protein
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach note</p>
          <h2>Protein drives the cut.</h2>
          <p>
            This gives TrackFit the daily food signal it needs before we build
            the full nutrition engine.
          </p>
        </div>
      </section>

      <section className="v4-mini-summary">
        <Salad size={18} />
        <span>Simple food tracking first. Fancy barcode wizardry later.</span>
        <Save size={18} />
      </section>
    </motion.div>
  );
}
