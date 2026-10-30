import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ClipboardList, Plus, Save, Trash2, Utensils } from "lucide-react";
import { MealPlanRepository } from "../services/mealPlanRepository";
import MealPlanImportPanel from "../components/meal/MealPlanImportPanel";
import { macroComparison, validateMealPlan } from "../services/mealPlanMath";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { NutritionCloudRepository } from "../services/repositories/nutritionCloudRepository";
import { getOperationalDate, getShiftMealTypes, getShiftMode, SHIFT_MODE_EVENT } from "../services/shift/shiftModeService";
import { signalTrackFitDataChange } from "../hooks/useTrackFitDataRefresh";
import "./TrackFitScreens.css";
import "./MealPlans.css";

const emptyMeal=()=>({id:crypto.randomUUID(),name:"",type:"Meal",calories:"",protein:"",carbs:"",fats:""});
const toForm=meal=>({id:meal.id||crypto.randomUUID(),name:meal.name||"",type:meal.type||"Meal",
  calories:meal.calories==null?"":String(meal.calories),
  protein:meal.protein==null?"":String(meal.protein),
  carbs:meal.carbs==null?"":String(meal.carbs),
  fats:meal.fats==null?"":String(meal.fats)});
const MACROS=[
  ["calories","Calories","kcal"],
  ["protein","Protein","g"],
  ["carbs","Carbs","g"],
  ["fats","Fats","g"],
];
const format=n=>n==null?"—":Number(n).toLocaleString("en-AU",{maximumFractionDigits:1});
export default function MealPlans(){
  const [shiftMode,setShiftMode] = useState(getShiftMode);
  const date=getOperationalDate(new Date(),shiftMode);
  const mealTypes=getShiftMealTypes(shiftMode);
  const [name,setName]=useState("");
  const [rows,setRows]=useState([emptyMeal()]);
  const [savedPlan,setSavedPlan]=useState(null);
  const [logged,setLogged]=useState(()=>NutritionRepository.getToday(date));
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [dirty,setDirty]=useState(false);
  const [loggingId,setLoggingId]=useState("");

  useEffect(()=>{
    const change=event=>setShiftMode(event.detail?.mode||getShiftMode());
    window.addEventListener(SHIFT_MODE_EVENT,change);
    return ()=>window.removeEventListener(SHIFT_MODE_EVENT,change);
  },[]);
  useEffect(()=>{
    let active=true;
    async function load(){
      setLoading(true);
      setMessage("");
      try{
        const [plan,food]=await Promise.all([
          MealPlanRepository.load(),
          NutritionCloudRepository.loadForDate(date),
        ]);
        if(!active)return;
        setSavedPlan(plan);
        setName(plan?.name||"");
        setRows(plan?.meals?.length?plan.meals.map(toForm):[emptyMeal()]);
        setLogged((food.meals||[]).filter(x=>x.date===date));
        setDirty(false);
      }catch(error){
        if(active){
          setMessage(error instanceof Error?error.message:"Could not load your meal plan.");
          setLogged(NutritionRepository.getToday(date));
        }
      }finally{if(active)setLoading(false);}
    }
    void load();
    return ()=>{active=false};
  },[date]);
  const comparison=useMemo(()=>macroComparison(savedPlan?.meals||[],logged),[savedPlan,logged]);
  function importPlan(meals, fileName) {
    if ((dirty || savedPlan) && !window.confirm(
      "Replace the current editor with the imported meals? Your saved meal plan will stay unchanged until you choose Save meal plan."
    )) return false;
    setRows(meals);
    if (!name.trim() && fileName) setName(fileName.replace(/\\.(pdf|txt)$/i, "").slice(0, 120));
    setDirty(true);
    setMessage(`${meals.length} meals added to your draft. Check the amounts, fill missing macros, then save the plan.`);
    return true;
  }
  function edit(id,field,value){
    setRows(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));
    setDirty(true);setMessage("");
  }
  function addMeal(){
    if(rows.length>=20){setMessage("Meal plans support up to 20 meals.");return;}
    setRows(current=>[...current,emptyMeal()]);setDirty(true);setMessage("");
  }
  function deleteRow(id){
    setRows(current=>current.filter(row=>row.id!==id));setDirty(true);setMessage("");
  }
  async function save(){
    if(busy)return;
    let valid;
    try{valid=validateMealPlan({name,meals:rows});}
    catch(error){setMessage(error.message);return;}
    setBusy(true);setMessage("");
    try{
      const result=await MealPlanRepository.save({name,meals:valid});
      setSavedPlan(result);setRows(result.meals.map(toForm));setDirty(false);
      setMessage("Meal plan saved to your TrackFit account. Compare it against today's food log below.");
    }catch(error){setMessage(error instanceof Error?error.message:"Meal plan couldn't be saved.");}
    finally{setBusy(false);}
  }
  async function remove(){
    if(busy||!savedPlan||!window.confirm("Delete this meal plan? Your meals already logged as eaten will stay in your food diary."))return;
    setBusy(true);setMessage("");
    try{
      await MealPlanRepository.remove();
      setSavedPlan(null);setName("");setRows([emptyMeal()]);setDirty(false);
      setMessage("Meal plan deleted. Your actual food history has not been changed.");
    }catch(error){setMessage(error instanceof Error?error.message:"Meal plan couldn't be deleted.");}
    finally{setBusy(false);}
  }
  async function logAsEaten(meal){
    if(loggingId||!window.confirm(`Add "${meal.name}" to today's food diary as eaten? Only do this if you've actually eaten it.`))return;
    setLoggingId(meal.id);setMessage("");
    try{
      const actual={id:crypto.randomUUID(),date,type:mealTypes.includes(meal.type)?meal.type:mealTypes[0],
        name:meal.name,calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fats:meal.fats,
        shiftMode,createdAt:new Date().toISOString()};
      const outcome=await NutritionCloudRepository.save(actual);
      setLogged(NutritionRepository.getToday(date));
      signalTrackFitDataChange();
      setMessage(outcome.cloudSaved
        ?"Meal logged as eaten and backed up."
        :"Meal logged as eaten on this device. Cloud backup is pending.");
    }catch(error){setMessage(error instanceof Error?error.message:"Could not log this meal.");}
    finally{setLoggingId("");}
  }
  return (
    <main className="screen tf-meal-plan" data-testid="trackfit-meal-plans">
      <Link to="/nutrition" className="tf-meal-plan-back"><ArrowLeft size={18}/> Back to Food</Link>
      <section className="v4-checkin-hero"><div><p className="eyebrow">Food · your routine</p><h1>Meal plans</h1><p>Build a daily meal template, then see how your actual food diary compares.</p></div></section>
      {loading ? <section className="form-card"><p>Loading your meal plan and food log...</p></section> : <>
        <section className="tf-meal-plan-overview" aria-label="Planned versus logged macros">
          <div className="tf-meal-plan-heading"><div><p className="eyebrow">{savedPlan?"Active daily template":"Plan comparison"}</p><h2>{savedPlan?.name||"Create your first plan"}</h2></div>
            <span>{date} · {shiftMode==="night"?"Night shift":"Day shift"}</span>
          </div>
          {savedPlan ? <>
            <p>Planned macros versus what you've actually logged as eaten today. Negative means under your plan.</p>
            <div className="tf-meal-plan-macro-grid">
              {MACROS.map(([key,label,unit])=><article key={key}>
                <small>{label}</small>
                <strong>{format(comparison.actual[key])}<span> / {format(comparison.planned[key])} {unit}</span></strong>
                <em>{comparison.delta[key]===null?"Not enough data":`${comparison.delta[key]>0?"+":""}${format(comparison.delta[key])} ${unit} vs plan`}</em>
              </article>)}
            </div>
            <p className="tf-meal-plan-count">{comparison.loggedCount} actually logged meal{comparison.loggedCount===1?"":"s"} today · {comparison.plannedCount} planned</p>
            {dirty && <p role="status">Your edits below are a draft. The comparison uses your last saved plan.</p>}
          </> : <p>Once you save a meal plan, its daily targets will appear here beside your actual logged calories and macros.</p>}
        </section>

        <MealPlanImportPanel onImport={importPlan} disabled={busy} />

        <section className="tf-meal-plan-editor">
          <div className="tf-meal-plan-heading"><div><p className="eyebrow">Plan builder</p><h2>{savedPlan?"Edit your meal plan":"Build your meal plan"}</h2></div><Utensils size={23}/></div>
          <p>Enter the nutrition for a typical day or work shift. Use verified labels or your usual portion sizes; missing carb/fat values can be left blank.</p>
          <label className="tf-meal-plan-label">Plan name
            <input aria-label="Meal plan name" maxLength={120} value={name} onChange={e=>{setName(e.target.value);setDirty(true);}}
              placeholder="e.g. Night Shift High Protein"/>
          </label>
          <div className="tf-meal-plan-list">
            {rows.map((row,index)=><fieldset className="tf-meal-plan-meal" key={row.id}>
              <legend>Meal {index+1}</legend>
              <label>Food or meal<input aria-label={`Meal ${index+1} name`} placeholder="e.g. Chicken, rice and veg" maxLength={120} value={row.name} onChange={e=>edit(row.id,"name",e.target.value)}/></label>
              <label>Meal slot<select aria-label={`Meal ${index+1} slot`} value={mealTypes.includes(row.type)?row.type:"other"} onChange={e=>edit(row.id,"type",e.target.value)}>
                <option value="other">Other meal</option>{mealTypes.map(type=><option value={type} key={type}>{type}</option>)}</select></label>
              <div className="tf-meal-plan-fields">
                {MACROS.map(([key,label,unit])=><label key={key}>{label} ({unit})<input aria-label={`Meal ${index+1} ${label}`} type="number" min="0" max="20000" step="0.1" inputMode="decimal" value={row[key]} onChange={e=>edit(row.id,key,e.target.value)} placeholder={key==="carbs"||key==="fats"?"Optional":"Required"}/></label>)}
              </div>
              <button className="tf-meal-plan-delete-row" type="button" onClick={()=>deleteRow(row.id)}><Trash2 size={16}/> Remove meal</button>
            </fieldset>)}
          </div>
          <div className="tf-meal-plan-actions">
            <button type="button" onClick={addMeal} disabled={rows.length>=20||busy} className="tf-meal-plan-add"><Plus size={18}/> Add meal</button>
            <button type="button" onClick={save} disabled={busy||!rows.length} className="tf-meal-plan-save"><Save size={18}/>{busy?"Saving...":"Save meal plan"}</button>
          </div>
          {savedPlan && <button type="button" className="tf-meal-plan-delete" disabled={busy} onClick={remove}><Trash2 size={17}/> Delete meal plan</button>}
        </section>

        {savedPlan && <section className="tf-meal-plan-editor">
          <div className="tf-meal-plan-heading"><div><p className="eyebrow">Today's meal actions</p><h2>Log a planned meal</h2></div><ClipboardList size={22}/></div>
          <p>Planning a meal does <strong>not</strong> count as eating it. Tap below only when you've actually had that food. Each tap creates one entry in today's diary.</p>
          {savedPlan.meals.map(meal=><div className="tf-meal-plan-log-row" key={meal.id}>
            <div><strong>{meal.name}</strong><small>{format(meal.calories)} kcal · {format(meal.protein)}g protein</small></div>
            <button disabled={Boolean(loggingId)} type="button" onClick={()=>logAsEaten(meal)}>{loggingId===meal.id?"Logging...":"Log as eaten"}</button>
          </div>)}
          <Link to="/nutrition" className="tf-meal-plan-food-link">View actual food diary <ArrowRight size={17}/></Link>
        </section>}
        {message && <p className="tf-meal-plan-message" role="status">{message}</p>}
      </>}
    </main>
  );
}
