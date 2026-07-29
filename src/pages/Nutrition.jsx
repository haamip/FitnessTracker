import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Beef, Camera, ClipboardPaste, Flame, Plus, Trash2, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { getOperationalDate, getShiftMealTypes, getShiftMode, SHIFT_MODE_EVENT } from "../services/shift/shiftModeService";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { parseMealText } from "../services/mealTextParser";
import "./TrackFitScreens.css";
import "./NutritionSimple.css";

const CALORIE_TARGET = 2500;
const PROTEIN_TARGET = 185;
const toNumber = (value) => Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : 0;
const roundDisplay = (value) => Number.parseFloat(toNumber(value).toFixed(2));
function fromDatabase(row) { return { id: row.id, date: row.entry_date, type: row.meal_type, name: row.name, calories: toNumber(row.calories), protein: toNumber(row.protein_g), carbs: toNumber(row.carbs_g), fats: toNumber(row.fats_g), createdAt: row.created_at }; }

export default function Nutrition() {
  const [shiftMode, setShiftModeState] = useState(getShiftMode);
  const operationalDate = getOperationalDate(new Date(), shiftMode);
  const mealTypes = getShiftMealTypes(shiftMode);
  const [meals, setMeals] = useState(() => NutritionRepository.getToday(operationalDate));
  const [form, setForm] = useState(() => ({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" }));
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onShiftChange = (event) => {
      const nextMode = event.detail?.mode || getShiftMode();
      const nextDate = getOperationalDate(new Date(), nextMode);
      const nextTypes = getShiftMealTypes(nextMode);
      setShiftModeState(nextMode);
      setMeals(NutritionRepository.getToday(nextDate));
      setForm((current) => ({ ...current, type: nextTypes[0] }));
    };
    window.addEventListener(SHIFT_MODE_EVENT, onShiftChange);
    return () => window.removeEventListener(SHIFT_MODE_EVENT, onShiftChange);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadMeals() {
      if (!isSupabaseConfigured || !supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const { data, error } = await supabase.from("nutrition_entries").select("*").eq("entry_date", operationalDate).order("created_at", { ascending: false });
      if (!active) return;
      if (error) { setMessage(`Cloud sync issue: ${error.message}`); return; }
      const nextMeals = (data || []).map(fromDatabase);
      setMeals(nextMeals);
      const otherDays = NutritionRepository.getAll().filter((meal) => meal.date !== operationalDate);
      NutritionRepository.saveAll([...nextMeals, ...otherDays]);
    }
    loadMeals();
    return () => { active = false; };
  }, [operationalDate]);

  const totals = useMemo(() => meals.reduce((sum, meal) => ({ calories: sum.calories + toNumber(meal.calories), protein: sum.protein + toNumber(meal.protein) }), { calories: 0, protein: 0 }), [meals]);
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  function handlePasteParse() {
    const result = parseMealText(pasteText);
    if (!result.recognised) { setMessage("Could not recognise that meal. Use the MEAL, ITEMS and TOTALS format."); return; }
    const matchingType = mealTypes.find((type) => type.toLowerCase() === result.mealType.toLowerCase());
    setForm({
      type: matchingType || form.type,
      name: result.name || form.name,
      calories: result.calories || "",
      protein: result.protein || "",
      carbs: result.carbs || "",
      fats: result.fats || "",
    });
    setMessage("Meal read. Check the numbers, then tap Add meal.");
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setMessage("");
    const localMeal = { id: crypto.randomUUID(), date: operationalDate, type: form.type, name: form.name.trim() || "Quick meal", calories: roundDisplay(form.calories), protein: roundDisplay(form.protein), carbs: roundDisplay(form.carbs), fats: roundDisplay(form.fats), shiftMode, createdAt: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const { data, error } = await supabase.from("nutrition_entries").insert({ user_id: userId, entry_date: localMeal.date, meal_type: localMeal.type, name: localMeal.name, calories: localMeal.calories, protein_g: localMeal.protein, carbs_g: localMeal.carbs, fats_g: localMeal.fats }).select().single();
        if (error) { setMessage(`Meal was not saved: ${error.message}`); setSaving(false); return; }
        const savedMeal = fromDatabase(data); NutritionRepository.add(savedMeal); setMeals((current) => [savedMeal, ...current]);
        setForm({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" }); setPasteText(""); setSaving(false); return;
      }
    }
    NutritionRepository.add(localMeal); setMeals(NutritionRepository.getToday(operationalDate)); setForm({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" }); setPasteText(""); setSaving(false);
  }

  async function deleteMeal(id) {
    setMessage("");
    if (isSupabaseConfigured && supabase) { const { error } = await supabase.from("nutrition_entries").delete().eq("id", id); if (error) { setMessage(`Meal was not deleted: ${error.message}`); return; } }
    NutritionRepository.saveAll(NutritionRepository.getAll().filter((meal) => meal.id !== id)); setMeals((current) => current.filter((meal) => meal.id !== id));
  }

  const calorieProgress = Math.min(100, (totals.calories / CALORIE_TARGET) * 100);
  const proteinProgress = Math.min(100, (totals.protein / PROTEIN_TARGET) * 100);
  return <motion.div className="screen checkin-v4" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
    <section className="v4-checkin-hero"><div><p className="eyebrow">Food · {shiftMode === "night" ? "Night shift" : "Day shift"}</p><h1>Shift day</h1><p>{shiftMode === "night" ? "After-midnight meals stay with the shift that started the night before." : "Meals use the current calendar day."}</p></div></section>
    <section className="tf-food-summary"><article className="tf-food-target"><div className="tf-food-target__top"><div><Flame size={20}/><span>Calories</span></div><strong>{roundDisplay(totals.calories)} / {CALORIE_TARGET}</strong></div><div className="progress-line"><span style={{width:`${calorieProgress}%`}}/></div></article><article className="tf-food-target"><div className="tf-food-target__top"><div><Beef size={20}/><span>Protein</span></div><strong>{roundDisplay(totals.protein)} / {PROTEIN_TARGET}g</strong></div><div className="progress-line"><span style={{width:`${proteinProgress}%`}}/></div></article></section>
    <Link className="tf-ai-primary" to="/nutrition/scan"><Camera size={18}/> Scan a meal photo</Link>
    <section className="form-card form-grid"><div><p className="eyebrow">Paste log</p><h2>Import a meal</h2><p>Paste the meal format from ChatGPT and TrackFit will fill the log.</p></div><textarea rows={8} value={pasteText} onChange={(event)=>setPasteText(event.target.value)} placeholder={"MEAL: Dinner\n\nITEMS\n- Steak | 180 g\n- Rice | 1 cup\n\nTOTALS\nCalories: 980\nProtein: 80 g\nCarbs: 55 g\nFat: 40 g"} style={{width:"100%",resize:"vertical",padding:16,borderRadius:16}}/><Button type="button" onClick={handlePasteParse} disabled={!pasteText.trim()}><ClipboardPaste size={17}/> Read meal</Button></section>
    <form className="form-card form-grid" onSubmit={handleSubmit}><div><p className="eyebrow">Quick log</p><h2>Add a meal</h2></div><label>Meal<select value={form.type} onChange={(e)=>updateField("type",e.target.value)}>{mealTypes.map((type)=><option key={type}>{type}</option>)}</select></label><label>What did you eat?<input placeholder="Chicken, rice and veg" value={form.name} onChange={(e)=>updateField("name",e.target.value)}/></label><div className="tf-food-input-row"><label>Calories<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.calories} onChange={(e)=>updateField("calories",e.target.value)}/></label><label>Protein<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.protein} onChange={(e)=>updateField("protein",e.target.value)}/></label></div><div className="tf-food-input-row"><label>Carbs<input type="number" inputMode="decimal" step="0.1" min="0" value={form.carbs} onChange={(e)=>updateField("carbs",e.target.value)}/></label><label>Fat<input type="number" inputMode="decimal" step="0.1" min="0" value={form.fats} onChange={(e)=>updateField("fats",e.target.value)}/></label></div><Button className="v4-save-checkin" type="submit" disabled={saving}><Plus size={17}/>{saving ? "Saving..." : "Add meal"}</Button>{message && <p role="status">{message}</p>}</form>
    {meals.length ? <section className="tf-food-meals"><div className="v4-section-heading"><div><p className="eyebrow">{operationalDate}</p><h2>Meals</h2></div></div><div className="v4-recovery-list">{meals.map((meal)=><article className="v4-recovery-row" key={meal.id}><div className="v4-icon-bubble small"><Utensils size={18}/></div><div><strong>{meal.name}</strong><span>{meal.type} · {roundDisplay(meal.calories)} cal · {roundDisplay(meal.protein)}g protein</span></div><button type="button" aria-label={`Delete ${meal.name}`} onClick={()=>deleteMeal(meal.id)}><Trash2 size={18}/></button></article>)}</div></section> : <section className="form-card"><p>No meals logged for this shift day.</p></section>}
  </motion.div>;
}
