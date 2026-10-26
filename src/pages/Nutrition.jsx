import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Beef, Camera, ClipboardPaste, Flame, Pencil, Plus, Trash2, Utensils, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { getOperationalDate, getShiftMealTypes, getShiftMode, SHIFT_MODE_EVENT } from "../services/shift/shiftModeService";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { parseMealText } from "../services/mealTextParser";
import { getFoodByBarcode, scaleFoodNutrients, searchFoodByName } from "../services/openFoodFacts";
import FoodBarcodeScanner from "../components/FoodBarcodeScanner";
import { signalTrackFitDataChange } from "../hooks/useTrackFitDataRefresh";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [shiftMode, setShiftModeState] = useState(getShiftMode);
  const operationalDate = getOperationalDate(new Date(), shiftMode);
  const mealTypes = getShiftMealTypes(shiftMode);
  const [meals, setMeals] = useState(() => NutritionRepository.getToday(operationalDate));
  const [form, setForm] = useState(() => {
    const scanned = location.state?.scannedMeal;
    return {
      type: mealTypes.includes(scanned?.type) ? scanned.type : mealTypes[0],
      name: scanned?.name || "",
      calories: String(scanned?.calories ?? ""),
      protein: String(scanned?.protein ?? ""),
      carbs: String(scanned?.carbs ?? ""),
      fats: String(scanned?.fats ?? ""),
    };
  });
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [barcode, setBarcode] = useState("");
  const [foodSearch, setFoodSearch] = useState("");
  const [foodSearchResults, setFoodSearchResults] = useState([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [recentMeals, setRecentMeals] = useState([]);
  const [foodAmount, setFoodAmount] = useState("100");
  const [foundFood, setFoundFood] = useState(null);
  const [findingFood, setFindingFood] = useState(false);
  const [message, setMessage] = useState(() => location.state?.scannedMeal ? "AI meal estimate loaded. Check the name, calories and macros, then save." : "");
  const [goals, setGoals] = useState({ calories: CALORIE_TARGET, protein: PROTEIN_TARGET });

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
      const userId = sessionData.session?.user?.id;
      if (!userId) return;
      const lookback = new Date(operationalDate + "T12:00:00Z");
      lookback.setUTCDate(lookback.getUTCDate() - 30);
      const [response, profileResponse] = await Promise.all([
        supabase.from("nutrition_entries").select("*").eq("user_id", userId)
          .gte("entry_date", lookback.toISOString().slice(0, 10))
          .order("created_at", { ascending: false }).limit(120),
        supabase.from("profiles").select("calorie_target,protein_target")
          .eq("id", userId).maybeSingle(),
      ]);
      const { data, error } = response;
      if (!active) return;
      if (error) { setMessage(`Cloud sync issue: ${error.message}`); return; }
      const allCloudMeals = (data || []).map(fromDatabase);
      const nextMeals = allCloudMeals.filter((meal) => meal.date === operationalDate);
      setMeals(nextMeals);
      const previouslyLogged = allCloudMeals.filter((meal) => meal.date !== operationalDate);
      const seen = new Set();
      setRecentMeals(previouslyLogged.filter((meal) => {
        const signature = [meal.name.toLowerCase(), meal.calories, meal.protein, meal.carbs, meal.fats].join("|");
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      }).slice(0, 8));
      if (!profileResponse.error) {
        const profile = profileResponse.data || {};
        setGoals({
          calories: Number(profile.calorie_target) > 0 ? Number(profile.calorie_target) : CALORIE_TARGET,
          protein: Number(profile.protein_target) > 0 ? Number(profile.protein_target) : PROTEIN_TARGET,
        });
      }
      const otherDays = NutritionRepository.getAll().filter((meal) => meal.date !== operationalDate);
      NutritionRepository.saveAll([...nextMeals, ...otherDays]);
    }
    loadMeals();
    return () => { active = false; };
  }, [operationalDate]);

  const totals = useMemo(() => meals.reduce((sum, meal) => ({ calories: sum.calories + toNumber(meal.calories), protein: sum.protein + toNumber(meal.protein), carbs: sum.carbs + toNumber(meal.carbs), fats: sum.fats + toNumber(meal.fats) }), { calories: 0, protein: 0, carbs: 0, fats: 0 }), [meals]);
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

  async function handleFoodSearch(event) {
    event?.preventDefault();
    if (foodSearching) return;
    setFoodSearching(true);
    setMessage("");
    setFoodSearchResults([]);
    try {
      const results = await searchFoodByName(foodSearch);
      setFoodSearchResults(results);
      if (!results.length) setMessage("No matching packaged foods found. You can still add the food manually below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Food search unavailable.");
    } finally {
      setFoodSearching(false);
    }
  }

  function selectSearchedFood(food) {
    setFoundFood(food);
    setFoodAmount("100");
    setMessage(`${food.name} selected. Choose the amount eaten, then copy the nutrition details into your meal.`);
    window.setTimeout(() => document.getElementById("tf-food-selected-product")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
  }

  async function handleBarcodeLookup(code = barcode) {
    if (findingFood) return;
    setFindingFood(true);
    setFoundFood(null);
    setMessage("");
    try {
      const product = await getFoodByBarcode(code);
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

  function handleScannedBarcode(code) {
    setBarcode(code);
    setFoundFood(null);
    void handleBarcodeLookup(code);
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
      setMessage("Food details copied into your meal below. Check the serving amount, label and missing macros before saving.");
      document.getElementById("tf-nutrition-meal-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check the serving amount.");
    }
  }

  function editMeal(meal) {
    setEditingMealId(meal.id);
    setForm({
      type: meal.type,
      name: meal.name,
      calories: String(meal.calories ?? ""),
      protein: String(meal.protein ?? ""),
      carbs: String(meal.carbs ?? ""),
      fats: String(meal.fats ?? ""),
    });
    setMessage(`Editing ${meal.name}. Review the values, then save changes below.`);
    document.getElementById("tf-nutrition-meal-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingMealId(null);
    setForm({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" });
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    if (!name) { setMessage("Enter a food or meal name."); return; }
    if (form.calories === "" || form.protein === "") {
      setMessage("Please enter calories and protein; missing database values are not zero.");
      return;
    }
    const values = [form.calories, form.protein, form.carbs, form.fats];
    if (values.some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      setMessage("Macros must be valid non-negative numbers.");
      return;
    }
    const existing = editingMealId ? meals.find((meal) => meal.id === editingMealId) : null;
    if (editingMealId && !existing) { setMessage("That meal is no longer available to edit."); return; }
    const meal = {
      ...(existing || {}),
      id: existing?.id || crypto.randomUUID(),
      date: operationalDate,
      type: form.type,
      name,
      calories: roundDisplay(form.calories),
      protein: roundDisplay(form.protein),
      carbs: form.carbs === "" ? null : roundDisplay(form.carbs),
      fats: form.fats === "" ? null : roundDisplay(form.fats),
      shiftMode,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    setSaving(true);
    setMessage("");
    try {
      let saved = meal;
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (userId) {
          const payload = {
            user_id: userId, entry_date: meal.date, meal_type: meal.type, name: meal.name,
            calories: meal.calories, protein_g: meal.protein, carbs_g: meal.carbs, fats_g: meal.fats,
          };
          const query = existing
            ? supabase.from("nutrition_entries").update(payload).eq("id", existing.id).eq("user_id", userId)
            : supabase.from("nutrition_entries").insert(payload);
          const { data, error } = await query.select().single();
          if (error) throw error;
          saved = fromDatabase(data);
        }
      }
      const next = [saved, ...NutritionRepository.getAll().filter((item) => item.id !== saved.id && item.id !== existing?.id)];
      NutritionRepository.saveAll(next);
      setMeals(next.filter((item) => item.date === operationalDate));
      signalTrackFitDataChange();
      setForm({ type: mealTypes[0], name: "", calories: "", protein: "", carbs: "", fats: "" });
      setEditingMealId(null);
      setPasteText("");
      setMessage(existing ? "Meal updated." : "Meal saved.");
      if (location.state?.scannedMeal) navigate(location.pathname, { replace: true, state: null });
    } catch (error) {
      setMessage(`Meal was not saved: ${error.message || "Please try again"}`);
    } finally {
      setSaving(false);
    }
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
          signalTrackFitDataChange();
          setMessage(`Added ${saved.name} again.`);
          return;
        }
      }
      NutritionRepository.add(copy);
      setMeals(NutritionRepository.getToday(operationalDate));
      signalTrackFitDataChange();
      setMessage(`Added ${copy.name} again.`);
    } catch (error) {
      setMessage(`Could not repeat meal: ${error.message || "Please try again"}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(id) {
    const meal = meals.find((item) => item.id === id);
    if (!meal || !window.confirm(`Delete ${meal.name} from today's food log?`)) return;
    setMessage("");
    if (isSupabaseConfigured && supabase) { const { error } = await supabase.from("nutrition_entries").delete().eq("id", id); if (error) { setMessage(`Meal was not deleted: ${error.message}`); return; } }
    NutritionRepository.saveAll(NutritionRepository.getAll().filter((meal) => meal.id !== id)); setMeals((current) => current.filter((meal) => meal.id !== id)); signalTrackFitDataChange();
    if (editingMealId === id) cancelEdit();
    setMessage("Meal deleted.");
  }

  const calorieProgress = Math.min(100, (totals.calories / goals.calories) * 100);
  const proteinProgress = Math.min(100, (totals.protein / goals.protein) * 100);
  return <motion.div className="screen checkin-v4" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
    <section className="v4-checkin-hero"><div><p className="eyebrow">Food · {shiftMode === "night" ? "Night shift" : "Day shift"}</p><h1>Shift day</h1><p>{shiftMode === "night" ? "After-midnight meals stay with the shift that started the night before." : "Meals use the current calendar day."} Log a meal below, or open a food lookup tool.</p></div></section>
    <section className="tf-food-quick-actions" aria-label="Quick ways to log food">
      <Link to="/nutrition/scan" className="tf-food-quick-action"><Camera size={19}/> Photo or homemade AI estimate</Link>
      <button type="button" className="tf-food-quick-action" onClick={() => {
        const lookup = document.getElementById("tf-food-lookup");
        if (lookup) { lookup.open = true; lookup.scrollIntoView({ behavior: "smooth", block: "start" }); }
      }}><Utensils size={19}/> Search or scan a barcode</button>
    </section>
    <section className="tf-food-summary"><article className="tf-food-target"><div className="tf-food-target__top"><div><Flame size={20}/><span>Calories</span></div><strong>{roundDisplay(totals.calories)} / {goals.calories}</strong></div><div className="progress-line"><span style={{width:`${calorieProgress}%`}}/></div></article><article className="tf-food-target"><div className="tf-food-target__top"><div><Beef size={20}/><span>Protein</span></div><strong>{roundDisplay(totals.protein)} / {goals.protein}g</strong></div><div className="progress-line"><span style={{width:`${proteinProgress}%`}}/></div></article></section>
    <div className="tf-food-secondary-macros"><span>Carbs <strong>{roundDisplay(totals.carbs)}g</strong></span><span>Fat <strong>{roundDisplay(totals.fats)}g</strong></span></div>
    {message && <p className="tf-food-feedback" role="status">{message}</p>}
    <form id="tf-nutrition-meal-form" className="form-card form-grid" onSubmit={handleSubmit}><div><p className="eyebrow">Quick log</p><h2>{editingMealId ? "Edit your meal" : "Add a meal"}</h2></div><label>Meal<select value={form.type} onChange={(e)=>updateField("type",e.target.value)}>{mealTypes.map((type)=><option key={type}>{type}</option>)}</select></label><label>What did you eat?<input placeholder="Chicken, rice and veg" value={form.name} onChange={(e)=>updateField("name",e.target.value)}/></label><div className="tf-food-input-row"><label>Calories<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.calories} onChange={(e)=>updateField("calories",e.target.value)}/></label><label>Protein<input type="number" inputMode="decimal" step="0.1" min="0" required value={form.protein} onChange={(e)=>updateField("protein",e.target.value)}/></label></div><div className="tf-food-input-row"><label>Carbs<input type="number" inputMode="decimal" step="0.1" min="0" value={form.carbs} onChange={(e)=>updateField("carbs",e.target.value)}/></label><label>Fat<input type="number" inputMode="decimal" step="0.1" min="0" value={form.fats} onChange={(e)=>updateField("fats",e.target.value)}/></label></div><Button className="v4-save-checkin" type="submit" disabled={saving}><Plus size={17}/>{saving ? "Saving..." : editingMealId ? "Save changes" : "Add meal"}</Button>{editingMealId && <button type="button" className="tf-food-cancel-edit" onClick={cancelEdit}><X size={17}/> Cancel editing</button>}</form>
    <details id="tf-food-lookup" className="tf-food-tool">
      <summary>Find food by name or barcode</summary>
      <section className="form-card form-grid" aria-label="Food database barcode lookup">
      <div><p className="eyebrow">Food database</p><h2>Find packaged food</h2><p>Search by food or brand name, scan a barcode, or enter its number. Check the label and portion before saving.</p></div>
      <form className="tf-food-lookup-search" onSubmit={handleFoodSearch}>
        <label>Search food by name
          <input type="search" autoComplete="off" placeholder="e.g. rolled oats, tuna, yoghurt" value={foodSearch}
            onChange={(event) => setFoodSearch(event.target.value)} maxLength={70} minLength={3} />
        </label>
        <Button type="submit" disabled={foodSearching || foodSearch.trim().length < 3}>
          {foodSearching ? "Searching foods..." : "Search packaged foods"}
        </Button>
      </form>
      {foodSearchResults.length > 0 && (
        <div className="tf-food-search-results" aria-label="Food search results">
          <small>{foodSearchResults.length} matching packaged foods. Select one to check its nutrition per 100 g.</small>
          {foodSearchResults.map((food) => (
            <button type="button" key={food.barcode} className="tf-food-search-result"
              onClick={() => selectSearchedFood(food)}>
              <strong>{food.name}</strong>
              <span>{food.brand || "Unbranded"} · {food.per100g.calories == null ? "Energy unknown" : `${Math.round(food.per100g.calories)} kcal`} / 100 g · {food.per100g.protein == null ? "Protein unknown" : `${food.per100g.protein}g protein`}</span>
            </button>
          ))}
        </div>
      )}
      <label>Barcode
        <input aria-label="Food barcode" type="text" inputMode="numeric" autoComplete="off" maxLength={14} value={barcode} onChange={(event) => { setBarcode(event.target.value.replace(/[^0-9]/g, "")); setFoundFood(null); }} placeholder="Scan number on package" />
      </label>
      <FoodBarcodeScanner onDetected={handleScannedBarcode} disabled={findingFood} />
      <Button type="button" disabled={findingFood || barcode.length < 8} onClick={() => handleBarcodeLookup()}>{findingFood ? "Searching..." : "Find food by number"}</Button>
      {foundFood && <div id="tf-food-selected-product" className="v4-quick-card">
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

    </details>
    <details className="tf-food-tool">
      <summary>Paste a meal from ChatGPT</summary>
      <section className="form-card form-grid"><div><p className="eyebrow">Paste log</p><h2>Import a meal</h2><p>Paste the meal format from ChatGPT and TrackFit will fill the log.</p></div><textarea rows={8} value={pasteText} onChange={(event)=>setPasteText(event.target.value)} placeholder={"MEAL: Dinner\n\nITEMS\n- Steak | 180 g\n- Rice | 1 cup\n\nTOTALS\nCalories: 980\nProtein: 80 g\nCarbs: 55 g\nFat: 40 g"} style={{width:"100%",resize:"vertical",padding:16,borderRadius:16}}/><Button type="button" onClick={handlePasteParse} disabled={!pasteText.trim()}><ClipboardPaste size={17}/> Read meal</Button></section>
    </details>
    
    {recentMeals.length > 0 && (
      <section className="tf-food-meals" aria-label="Recent meals">
        <div className="v4-section-heading"><div><p className="eyebrow">Recent food history</p><h2>Log it again</h2></div></div>
        <p className="tf-food-recent-note">Meals you previously saved to your account. Tap Repeat to add one to today's shift day.</p>
        <div className="v4-recovery-list">
          {recentMeals.map((meal) => (
            <article className="v4-recovery-row" key={meal.id}>
              <div className="v4-icon-bubble small"><Utensils size={18}/></div>
              <div><strong>{meal.name}</strong><span>{roundDisplay(meal.calories)} cal · {roundDisplay(meal.protein)}g protein</span></div>
              <button type="button" onClick={() => repeatMeal(meal)} disabled={saving}
                aria-label={`Repeat ${meal.name} today`} title="Repeat today">
                <Plus size={18}/>
              </button>
            </article>
          ))}
        </div>
      </section>
    )}
    {meals.length ? <section className="tf-food-meals"><div className="v4-section-heading"><div><p className="eyebrow">{operationalDate}</p><h2>Meals</h2></div></div><div className="v4-recovery-list">{meals.map((meal)=><article className="v4-recovery-row" key={meal.id}><div className="v4-icon-bubble small"><Utensils size={18}/></div><div><strong>{meal.name}</strong><span>{meal.type} · {roundDisplay(meal.calories)} cal · {roundDisplay(meal.protein)}g protein</span></div><button type="button" aria-label={`Edit ${meal.name}`} title="Edit meal" disabled={saving} onClick={() => editMeal(meal)}><Pencil size={18}/></button><button type="button" aria-label={`Repeat ${meal.name}`} title="Log this meal again" disabled={saving} onClick={()=>repeatMeal(meal)}><Plus size={18}/></button><button type="button" aria-label={`Delete ${meal.name}`} disabled={saving} onClick={()=>deleteMeal(meal.id)}><Trash2 size={18}/></button></article>)}</div></section> : <section className="form-card"><p>No meals logged for this shift day.</p></section>}
  </motion.div>;
}
