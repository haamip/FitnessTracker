import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Beef, Camera, ClipboardPaste, Flame, Plus, Trash2, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { getOperationalDate, getShiftMealTypes, getShiftMode, SHIFT_MODE_EVENT } from "../services/shift/shiftModeService";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { parseMealText } from "../services/mealTextParser";
import { getFoodByBarcode, scaleFoodNutrients } from "../services/openFoodFacts";
import "./TrackFitScreens.css";
import "./NutritionSimple.css";

const CALORIE_TARGET = 2500;
const PROTEIN_TARGET = 185;
const toNumber = (value) => Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : 0;
const roundDisplay = (value) => Number.parseFloat(toNumber(value).toFixed(2));

/**
 * Convert generic imported labels such as Snack or Drink into one of the
 * meal categories available for the user's current day/night shift mode.
 */
function resolveMealType(parsedType, mealTypes, shiftMode, fallback) {
  const requested = parsedType.trim().toLowerCase();
  const exactMatch = mealTypes.find((type) => type.toLowerCase() === requested);
  if (exactMatch) return exactMatch;

  const preferredLabels = shiftMode === "night"
    ? {
        breakfast: "Post-shift meal",
        lunch: "Main break",
        dinner: "Pre-shift meal",
        snack: "Night smoko",
        drink: "Night smoko",
        shake: "Shake",
        "morning smoko": "Morning smoko",
        "afternoon smoko": "Night smoko",
      }
    : {
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
        snack: "Morning smoko",
        drink: "Morning smoko",
        shake: "Shake",
        "morning smoko": "Morning smoko",
        "afternoon smoko": "Afternoon smoko",
      };

  const preferred = preferredLabels[requested];
  return mealTypes.find((type) => type === preferred) || fallback;
}

function fromDatabase(row) { return { id: row.id, date: row.entry_date, type: row.meal_type, name: row.name, calories: toNumber(row.calories), protein: toNumber(row.protein_g), carbs: toNumber(row.carbs_g), fats: toNumber(row.fats_g), createdAt: row.created_at }; }

export default function Nutrition() {
  const [shiftMode, setShiftModeState] = useState(getShiftMode);
  const operationalDate = getOperationalDate(new Date(), shiftMode);
  const mealTypes = getShiftMealTypes(shiftMode);
  const [meals, setMeals] = useState(() => NutritionRepository.getToday(operationalDate));
  const [form, setForm] = useState(() => ({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" }));
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [foodAmount, setFoodAmount] = useState("100");
  const [foundFood, setFoundFood] = useState(null);
  const [findingFood, setFindingFood] = useState(false);
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
    const matchingType = resolveMealType(result.mealType, mealTypes, shiftMode, form.type);
    setForm({
      type: matchingType,
      name: result.name || form.name,
      calories: result.calories || "",
      protein: result.protein || "",
      carbs: result.carbs || "",
      fats: result.fats || "",
    });
    setMessage(`${matchingType} selected. Check the numbers, then tap Add meal.`);
  }

  async function handleBarcodeLookup() {
    if (findingFood) return;
    setFindingFood(true);
    setFoundFood(null);
    setMessage("");
    try {
      const product = await getFoodByBarcode(barcode);
      if (!product) {
        setMessage("Product not found. You can still add a meal manually.");
      } else {
        setFoundFood(product);
        setMessage(`Found ${product.name}. Check the pack label before logging.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not look up that product.");
    } finally {
      setFindingFood(false);
    }
  }

  function useFoundFood() {
    if (!foundFood) return;
    try {
      const values = scaleFoodNutrients(foundFood, foodAmount);
      setForm((current) => ({
        ...current,
        name: [foundFood.name, foundFood.brand].filter(Boolean).join(" · "),
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fats: values.fats,
      }));
      setMessage("Food details copied to Add a meal. Review the values, then save.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check the serving amount.");
    }
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

  async function repeatMeal(meal) {
    setSaving(true);
    setMessage("");
    const copy = {
      ...meal,
      id: crypto.randomUUID(),
      date: operationalDate,
      shiftMode,
      createdAt: new Date().toISOString(),
    };
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (userId) {
          const { data, error } = await supabase.from("nutrition_entries").insert({
            user_id: userId,
            entry_date: copy.date,
            meal_type: copy.type,
            name: copy.name,
            calories: copy.calories,
            protein_g: copy.protein,
            carbs_g: copy.carbs,
            fats_g: copy.fats,
          }).select().single();
          if (error) throw error;
          const saved = fromDatabase(data);
          NutritionRepository.add(saved);
          setMeals((current) => [saved, ...current]);
          setMessage(`Added ${saved.name} again.`);
          return;
        }
      }
      NutritionRepository.add(copy);
      setMeals(NutritionRepository.getToday(operationalDate));
      setMessage(`Added ${copy.name} again.`);
    } catch (error) {
      setMessage(`Could not repeat meal: ${error.message || "Please try again"}`);
    } finally {
      setSaving(false);
    }
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
    <section className="form-card form-grid" aria-label="Food database barcode lookup">
      <div><p className="eyebrow">Food database</p><h2>Find packaged food</h2><p>Enter a barcode to look up nutrition details. You can edit everything before saving.</p></div>
      <label>Barcode
        <input aria-label="Food barcode" type="text" inputMode="numeric" autoComplete="off" maxLength={14} value={barcode} onChange={(event) => { setBarcode(event.target.value.replace(/[^0-9]/g, "")); setFoundFood(null); }} placeholder="Scan number on package" />
      </label>
      <Button type="button" disabled={findingFood || barcode.length < 8} onClick={handleBarcodeLookup}>{findingFood ? "Searching..." : "Find food"}</Button>
      {foundFood && <div className="v4-quick-card">
        <strong>{foundFood.name}</strong>
        <span>{foundFood.brand || "Brand not supplied"} · {foundFood.barcode}</span>
        <span>Per 100 g: {foundFood.per100g.calories === null ? "Calories unknown" : `${Math.round(foundFood.per100g.calories)} kcal`} · {foundFood.per100g.protein === null ? "Protein unknown" : `${foundFood.per100g.protein}g protein`}</span>
        <label>Amount eaten (grams)
          <input aria-label="Amount eaten in grams" type="number" inputMode="decimal" min="1" max="10000" step="1" value={foodAmount} onChange={(event) => setFoodAmount(event.target.value)} />
        </label>
        <Button type="button" onClick={useFoundFood}>Use these values in my meal</Button>
        <small>Nutrition data from <a href={foundFood.sourceUrl} target="_blank" rel="noreferrer">Open Food Facts</a> (ODbL). Community-entered information may be incomplete; check your food packaging.</small>
      </div>}
    </section>
        <Link className="tf-ai-primary" to="/nutrition/scan"><Camera size={18}/> Scan a meal photo</Link>
    <section className="form-card form-grid"><div><p className="eyebrow">Paste log</p><h2>Import a meal</h2><p>Paste the meal format from ChatGPT and TrackFit will fill the log.</p></div><textarea rows={8} value={pasteText} onChange={(event)=>setPasteText(event.target.value)} placeholder={"MEAL: Dinner\n\nITEMS\n- Steak | 180 g\n- Rice | 1 cup\n\nTOTALS\nCalories: 980\nProtein: 80 g\nCarbs: 55 g\nFat: 40 g"} style={{width:"100%",resize:"vertical",padding:16,borderRadius:16}}/><Button type="button" onClick={handlePasteParse} disabled={!pasteText.trim()}><ClipboardPaste size={17}/> Read meal</Button></section>
    <form className="form-card form-grid" onSubmit={handleSubmit}><div><p className="eyebrow">Quick log</p><h2>Add a meal</h2></div><label>Meal<select value={form.type} onChange={(e)=>updateField("type",e.target.value)}>{mealTypes.map((type)=><option key={type}>{type}</option>)}</select></label><label>What did you eat?<input placeholder="Chicken, rice and veg" value={form.name} onChange={(e)=>updateField("name",e.target.value)}/></label><div className="tf-food-input-row"><label>Calories<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.calories} onChange={(e)=>updateField("calories",e.target.value)}/></label><label>Protein<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.protein} onChange={(e)=>updateField("protein",e.target.value)}/></label></div><div className="tf-food-input-row"><label>Carbs<input type="number" inputMode="decimal" step="0.1" min="0" value={form.carbs} onChange={(e)=>updateField("carbs",e.target.value)}/></label><label>Fat<input type="number" inputMode="decimal" step="0.1" min="0" value={form.fats} onChange={(e)=>updateField("fats",e.target.value)}/></label></div><Button className="v4-save-checkin" type="submit" disabled={saving}><Plus size={17}/>{saving ? "Saving..." : "Add meal"}</Button>{message && <p role="status">{message}</p>}</form>
    {meals.length ? <section className="tf-food-meals"><div className="v4-section-heading"><div><p className="eyebrow">{operationalDate}</p><h2>Meals</h2></div></div><div className="v4-recovery-list">{meals.map((meal)=><article className="v4-recovery-row" key={meal.id}><div className="v4-icon-bubble small"><Utensils size={18}/></div><div><strong>{meal.name}</strong><span>{meal.type} · {roundDisplay(meal.calories)} cal · {roundDisplay(meal.protein)}g protein</span></div><button type="button" aria-label={`Repeat ${meal.name}`} title="Log this meal again" disabled={saving} onClick={()=>repeatMeal(meal)}><Plus size={18}/></button><button type="button" aria-label={`Delete ${meal.name}`} disabled={saving} onClick={()=>deleteMeal(meal.id)}><Trash2 size={18}/></button></article>)}</div></section> : <section className="form-card"><p>No meals logged for this shift day.</p></section>}
  </motion.div>;
}
