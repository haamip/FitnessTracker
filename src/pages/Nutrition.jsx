import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Beef, Flame, Plus, Trash2, Utensils } from "lucide-react";
import Button from "../components/ui/Button";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";
import "./NutritionSimple.css";

const CALORIE_TARGET = 2500;
const PROTEIN_TARGET = 185;
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Shake"];
const initialForm = { type: "Breakfast", name: "", calories: "", protein: "" };
const today = new Date().toLocaleDateString("en-CA");
const toNumber = (value) => Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : 0;

export default function Nutrition() {
  const [meals, setMeals] = useState(() => NutritionRepository.getToday(today));
  const [form, setForm] = useState(initialForm);
  const totals = useMemo(() => meals.reduce((sum, meal) => ({ calories: sum.calories + toNumber(meal.calories), protein: sum.protein + toNumber(meal.protein) }), { calories: 0, protein: 0 }), [meals]);
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  function handleSubmit(event) {
    event.preventDefault();
    NutritionRepository.add({ id: crypto.randomUUID(), date: today, type: form.type, name: form.name.trim() || "Quick meal", calories: Math.round(toNumber(form.calories)), protein: Math.round(toNumber(form.protein)), carbs: 0, fats: 0, createdAt: new Date().toISOString() });
    setMeals(NutritionRepository.getToday(today));
    setForm(initialForm);
  }

  function deleteMeal(id) {
    NutritionRepository.saveAll(NutritionRepository.getAll().filter((meal) => meal.id !== id));
    setMeals(NutritionRepository.getToday(today));
  }

  const calorieProgress = Math.min(100, (totals.calories / CALORIE_TARGET) * 100);
  const proteinProgress = Math.min(100, (totals.protein / PROTEIN_TARGET) * 100);

  return <motion.div className="screen checkin-v4" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
    <section className="v4-checkin-hero"><div><p className="eyebrow">Food</p><h1>Today</h1><p>Track the two numbers that matter most.</p></div></section>
    <section className="tf-food-summary">
      <article className="tf-food-target"><div className="tf-food-target__top"><div><Flame size={20}/><span>Calories</span></div><strong>{totals.calories} / {CALORIE_TARGET}</strong></div><div className="progress-line"><span style={{width:`${calorieProgress}%`}}/></div></article>
      <article className="tf-food-target"><div className="tf-food-target__top"><div><Beef size={20}/><span>Protein</span></div><strong>{totals.protein} / {PROTEIN_TARGET}g</strong></div><div className="progress-line"><span style={{width:`${proteinProgress}%`}}/></div></article>
    </section>
    <form className="form-card form-grid" onSubmit={handleSubmit}><div><p className="eyebrow">Quick log</p><h2>Add a meal</h2></div><label>Meal<select value={form.type} onChange={(e)=>updateField("type",e.target.value)}>{mealTypes.map((type)=><option key={type}>{type}</option>)}</select></label><label>What did you eat?<input placeholder="Chicken, rice and veg" value={form.name} onChange={(e)=>updateField("name",e.target.value)}/></label><div className="tf-food-input-row"><label>Calories<input type="number" min="0" required value={form.calories} onChange={(e)=>updateField("calories",e.target.value)}/></label><label>Protein<input type="number" min="0" required value={form.protein} onChange={(e)=>updateField("protein",e.target.value)}/></label></div><Button className="v4-save-checkin" type="submit"><Plus size={17}/>Add meal</Button></form>
    {meals.length ? <section className="tf-food-meals"><div className="v4-section-heading"><div><p className="eyebrow">Today</p><h2>Meals</h2></div></div><div className="v4-recovery-list">{meals.map((meal)=><article className="v4-recovery-row" key={meal.id}><div className="v4-icon-bubble small"><Utensils size={18}/></div><div><strong>{meal.name}</strong><span>{meal.type} · {meal.calories} cal · {meal.protein}g protein</span></div><button type="button" aria-label={`Delete ${meal.name}`} onClick={()=>deleteMeal(meal.id)}><Trash2 size={18}/></button></article>)}</div></section> : <section className="form-card"><p>No meals logged today.</p></section>}
  </motion.div>;
}
