import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Beef, Flame, Plus, Utensils } from "lucide-react";

import Button from "../components/ui/Button";
import "./TrackFitScreens.css";

const CALORIE_TARGET = 2500;
const PROTEIN_TARGET = 185;
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Shake"];

const starterMeals = [
  {
    id: "meal-1",
    type: "Breakfast",
    name: "Oats, protein and banana",
    calories: 520,
    protein: 42,
  },
  {
    id: "meal-2",
    type: "Lunch",
    name: "Chicken, rice and veg",
    calories: 680,
    protein: 58,
  },
];

const initialForm = {
  type: "Breakfast",
  name: "",
  calories: "",
  protein: "",
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
        }),
        { calories: 0, protein: 0 },
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
    };

    setMeals((current) => [newMeal, ...current]);
    setForm(initialForm);
  }

  const calorieProgress = Math.min(100, (totals.calories / CALORIE_TARGET) * 100);
  const proteinProgress = Math.min(100, (totals.protein / PROTEIN_TARGET) * 100);

  return (
    <motion.div
      className="screen checkin-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section className="v4-checkin-hero">
        <div>
          <p className="eyebrow">Food</p>
          <h1>Today</h1>
          <p>Track the two numbers that matter most.</p>
        </div>
      </section>

      <section className="tf-food-summary">
        <article className="tf-food-target">
          <div className="tf-food-target__top">
            <div>
              <Flame size={20} />
              <span>Calories</span>
            </div>
            <strong>
              {totals.calories} / {CALORIE_TARGET}
            </strong>
          </div>
          <div className="progress-line">
            <span style={{ width: `${calorieProgress}%` }} />
          </div>
        </article>

        <article className="tf-food-target">
          <div className="tf-food-target__top">
            <div>
              <Beef size={20} />
              <span>Protein</span>
            </div>
            <strong>
              {totals.protein} / {PROTEIN_TARGET}g
            </strong>
          </div>
          <div className="progress-line">
            <span style={{ width: `${proteinProgress}%` }} />
          </div>
        </article>
      </section>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Quick log</p>
          <h2>Add a meal</h2>
        </div>

        <label>
          Meal
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
          What did you eat?
          <input
            placeholder="Chicken, rice and veg"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </label>

        <div className="tf-food-input-row">
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
            Protein
            <input
              inputMode="numeric"
              min="0"
              type="number"
              value={form.protein}
              onChange={(event) => updateField("protein", event.target.value)}
            />
          </label>
        </div>

        <Button className="v4-save-checkin" type="submit">
          <Plus size={17} />
          Add meal
        </Button>
      </form>

      {meals.length > 0 && (
        <section className="tf-food-meals">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Meals</h2>
            </div>
          </div>

          <div className="v4-recovery-list">
            {meals.map((meal) => (
              <article className="v4-recovery-row" key={meal.id}>
                <div className="v4-icon-bubble small">
                  <Utensils size={18} />
                </div>
                <div>
                  <strong>{meal.name}</strong>
                  <span>
                    {meal.type} · {meal.calories} cal · {meal.protein}g protein
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
