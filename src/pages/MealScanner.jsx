import { useMemo, useState } from "react";
import { Camera, Check, ImagePlus, Save, Sparkles } from "lucide-react";
import { analyseMealPhoto } from "../services/ai/aiFeatureService";
import { NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { getOperationalDate, getShiftMealTypes, getShiftMode } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";
import "./AISuite.css";

export default function MealScanner() {
  const mealTypes = getShiftMealTypes();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState(mealTypes[0]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  async function scanMeal() {
    if (!file) return;
    setLoading(true);
    setStatus("");
    try { setResult(await analyseMealPhoto(file)); }
    catch (error) { setStatus(error.message || "Meal scan failed."); }
    finally { setLoading(false); }
  }

  function saveMeal() {
    if (!result) return;
    NutritionRepository.add({
      id: crypto.randomUUID(),
      date: getOperationalDate(),
      type: mealType,
      name: result.mealName,
      calories: Number(result.calories) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fats: Number(result.fats) || 0,
      source: "ai-meal-scan",
      shiftMode: getShiftMode(),
      confidence: result.confidence,
      createdAt: new Date().toISOString(),
    });
    setStatus(`${result.mealName} saved to ${mealType}.`);
  }

  return (
    <main className="screen tf-ai-suite">
      <section className="tf-ai-hero"><Camera size={30} /><p className="eyebrow">AI meal scanner</p><h1>Photo to macros</h1><p>Take a meal photo, review the estimate, then save it to the active shift day.</p></section>
      <section className="form-card tf-ai-upload-card">
        <label className="tf-ai-file-picker"><ImagePlus size={24} /><strong>{file ? file.name : "Take or choose a meal photo"}</strong><span>Photos are estimates, not laboratory measurements.</span><input accept="image/*" capture="environment" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setStatus(""); }} type="file" /></label>
        {preview && <img className="tf-ai-preview" src={preview} alt="Meal preview" />}
        <button className="tf-ai-primary" disabled={!file || loading} onClick={scanMeal} type="button"><Sparkles size={18} /> {loading ? "Analysing meal..." : "Estimate calories and macros"}</button>
        {status && <p role="status">{status}</p>}
      </section>
      {result && (
        <section className="form-card tf-ai-result-card">
          <div className="tf-ai-result-heading"><div><p className="eyebrow">Estimate</p><h2>{result.mealName}</h2></div><span>{Math.round(result.confidence * 100)}% confidence</span></div>
          <div className="tf-ai-macro-grid"><article><strong>{result.calories}</strong><span>Calories</span></article><article><strong>{result.protein}g</strong><span>Protein</span></article><article><strong>{result.carbs}g</strong><span>Carbs</span></article><article><strong>{result.fats}g</strong><span>Fat</span></article></div>
          <div className="tf-ai-item-list">{result.items.map((item) => <article key={item.name}><Check size={18} /><div><strong>{item.name}</strong><span>{item.amount} · {item.calories} cal</span></div><small>{Math.round(item.confidence * 100)}%</small></article>)}</div>
          <label>Log this as<select value={mealType} onChange={(event) => setMealType(event.target.value)}>{mealTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <button className="tf-ai-primary" onClick={saveMeal} type="button"><Save size={18} /> Save meal</button>
          {result.mode === "demo" && <p className="tf-ai-demo-note">Demo estimate shown until the secure AI endpoint is connected.</p>}
        </section>
      )}
    </main>
  );
}
