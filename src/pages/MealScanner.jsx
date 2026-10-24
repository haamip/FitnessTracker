import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, ImagePlus, Save, Sparkles } from "lucide-react";
import { analyseMealPhoto } from "../services/ai/aiFeatureService";

import { getShiftMealTypes } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";
import "./AISuite.css";

const LIVE_AI_CONFIGURED = Boolean(import.meta.env.VITE_TRACKFIT_AI_ENDPOINT);

export default function MealScanner() {
  const navigate = useNavigate();
  const mealTypes = getShiftMealTypes();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState(mealTypes[0]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  async function scanMeal() {
    if (!file || !LIVE_AI_CONFIGURED) return;
    setLoading(true);
    setStatus("");
    try { setResult(await analyseMealPhoto(file)); }
    catch (error) { setStatus(error.message || "Meal scan failed."); }
    finally { setLoading(false); }
  }

  function reviewMeal() {
    if (!result || result.mode === "demo") return;
    navigate("/nutrition", {
      state: {
        scannedMeal: {
          type: mealType,
          name: result.mealName || "Scanned meal",
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
        },
      },
    });
  }

  return (
    <main className="screen tf-ai-suite">
      <section className="tf-ai-hero"><Camera size={30} /><p className="eyebrow">AI meal scanner</p><h1>Photo to macros</h1><p>Take a meal photo, then check the estimate in your Nutrition log before saving.</p></section>
      {!LIVE_AI_CONFIGURED && (
        <section className="form-card">
          <strong>AI photo analysis isn't connected yet</strong>
          <p>This screen can take a photo, but live nutrition estimates need a secure AI service.
          For now, use Food → Scan barcode for packaged food, or paste a ChatGPT meal estimate into the food log. We won't save made-up demo macros.</p>
        </section>
      )}
      <section className="form-card tf-ai-upload-card">
        <label className="tf-ai-file-picker"><ImagePlus size={24} /><strong>{file ? file.name : "Take or choose a meal photo"}</strong><span>Photos are estimates, not laboratory measurements.</span><input accept="image/*" capture="environment" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setStatus(""); }} type="file" /></label>
        {preview && <img className="tf-ai-preview" src={preview} alt="Meal preview" />}
        <button className="tf-ai-primary" disabled={!file || loading || !LIVE_AI_CONFIGURED} onClick={scanMeal} type="button"><Sparkles size={18} /> {loading ? "Analysing meal..." : "Estimate calories and macros"}</button>
        {status && <p role="status">{status}</p>}
      </section>
      {result && (
        <section className="form-card tf-ai-result-card">
          <div className="tf-ai-result-heading"><div><p className="eyebrow">Estimate</p><h2>{result.mealName}</h2></div><span>{Math.round(result.confidence * 100)}% confidence</span></div>
          <div className="tf-ai-macro-grid"><article><strong>{result.calories}</strong><span>Calories</span></article><article><strong>{result.protein}g</strong><span>Protein</span></article><article><strong>{result.carbs}g</strong><span>Carbs</span></article><article><strong>{result.fats}g</strong><span>Fat</span></article></div>
          <div className="tf-ai-item-list">{result.items.map((item) => <article key={item.name}><Check size={18} /><div><strong>{item.name}</strong><span>{item.amount} · {item.calories} cal</span></div><small>{Math.round(item.confidence * 100)}%</small></article>)}</div>
          <label>Log this as<select value={mealType} onChange={(event) => setMealType(event.target.value)}>{mealTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <button className="tf-ai-primary" onClick={reviewMeal} disabled={result.mode === "demo"} type="button"><Save size={18} /> Review and save in Nutrition</button>
          {result.mode === "demo" && <p className="tf-ai-demo-note">Demo estimate shown until the secure AI endpoint is connected.</p>}
        </section>
      )}
    </main>
  );
}
