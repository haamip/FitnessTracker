import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, ImagePlus, Save, Sparkles, UtensilsCrossed } from "lucide-react";
import { estimateMeal } from "../services/ai/mealEstimateClient";
import { getShiftMealTypes } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";
import "./AISuite.css";
import "./MealScanner.css";

const fmt = (number, suffix = "") => number == null ? "Unknown" : `${Math.round(number)}${suffix}`;

export default function MealScanner() {
  const navigate = useNavigate();
  const mealTypes = getShiftMealTypes();
  const [mode, setMode] = useState("photo");
  const [file, setFile] = useState(null);
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState(mealTypes[0]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function changeMode(next) {
    if (loading) return;
    setMode(next);
    setResult(null);
    setStatus("");
  }

  async function scanMeal() {
    if (loading) return;
    if (mode === "photo" && !file) return setStatus("Take or choose a photo first.");
    if (mode === "homemade" && description.trim().length < 8) return setStatus("Describe the ingredients and approximate amounts.");
    setLoading(true);
    setResult(null);
    setStatus("");
    try {
      const estimate = await estimateMeal({ file: mode === "photo" ? file : null, description });
      setResult(estimate);
      if (estimate.calories === null || estimate.protein === null) {
        setStatus("Not enough information to calculate all macros. Add missing amounts manually when reviewing.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not estimate this meal.");
    } finally {
      setLoading(false);
    }
  }

  function reviewMeal() {
    if (!result || result.mode !== "live") return;
    navigate("/nutrition", {
      state: {
        scannedMeal: {
          type: mealType,
          name: result.mealName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
        },
      },
    });
  }

  return (
    <main className="screen tf-ai-suite tf-meal-estimate">
      <section className="tf-ai-hero">
        <Camera size={28}/>
        <p className="eyebrow">TRACKFIT FOOD</p>
        <h1>What's for dinner?</h1>
        <p>Photograph your plate or describe your homemade meal. We'll estimate the nutrition, then you check it before saving.</p>
      </section>

      <div className="tf-meal-estimate__modes" role="group" aria-label="How to estimate a meal">
        <button type="button" aria-pressed={mode === "photo"} onClick={() => changeMode("photo")}>
          <Camera size={19}/> Meal photo
        </button>
        <button type="button" aria-pressed={mode === "homemade"} onClick={() => changeMode("homemade")}>
          <UtensilsCrossed size={19}/> Homemade meal
        </button>
      </div>

      <section className="form-card tf-ai-upload-card">
        {mode === "photo" && (
          <>
            <label className="tf-ai-file-picker">
              <ImagePlus size={24}/>
              <strong>{file ? file.name : "Take or choose a meal photo"}</strong>
              <span>JPEG, PNG or WebP, up to 8 MB. Photo will be resized on your phone.</span>
              <input accept="image/jpeg,image/png,image/webp" capture="environment" type="file"
                onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setStatus(""); }} />
            </label>
            {preview && <img className="tf-ai-preview" src={preview} alt="Selected meal preview"/>}
          </>
        )}
        <label className="tf-meal-estimate__description">
          <strong>{mode === "photo" ? "Extra details (optional)" : "Describe what you ate"}</strong>
          <span>{mode === "photo" ? "Help estimate hidden ingredients, oils and portions." : "Include approximate portions, cooking oil, sauces and drinks for a more useful estimate."}</span>
          <textarea rows={4} maxLength={700} value={description}
            onChange={(event) => { setDescription(event.target.value); setResult(null); }}
            placeholder={mode === "photo" ? "e.g. Chicken thigh with skin, 1 cup rice, creamy sauce" : "e.g. 200 g cooked chicken, 1 cup cooked rice, mixed vegetables, 1 tbsp olive oil"} />
        </label>
        <button className="tf-ai-primary" type="button" disabled={loading || (mode === "photo" ? !file : description.trim().length < 8)} onClick={scanMeal}>
          <Sparkles size={18}/>{loading ? "Estimating your meal..." : "Estimate calories and macros"}
        </button>
        {status && <p className="tf-meal-estimate__status" role="status">{status}</p>}
        <small>Estimate only, not a measurement. Photos are processed on request by an AI provider and are not saved in TrackFit. Your existing daily AI request limit also applies here.</small>
      </section>

      {result && (
        <section className="form-card tf-ai-result-card">
          <div className="tf-ai-result-heading">
            <div><p className="eyebrow">AI ESTIMATE · PLEASE VERIFY</p><h2>{result.mealName}</h2></div>
          </div>
          <div className="tf-ai-macro-grid">
            <article><strong>{fmt(result.calories)}</strong><span>Calories (kcal)</span></article>
            <article><strong>{fmt(result.protein, "g")}</strong><span>Protein</span></article>
            <article><strong>{fmt(result.carbs, "g")}</strong><span>Carbs</span></article>
            <article><strong>{fmt(result.fats, "g")}</strong><span>Fat</span></article>
          </div>
          {result.items.length > 0 && (
            <div className="tf-ai-item-list">
              {result.items.map((item, index) => (
                <article key={index}><Check size={18}/><div><strong>{item.name}</strong><span>{item.amount || "Amount unknown"} · {fmt(item.calories, " kcal")}</span></div></article>
              ))}
            </div>
          )}
          {result.assumptions && <p className="tf-meal-estimate__assumptions"><strong>Check these assumptions:</strong> {result.assumptions}</p>}
          <p className="tf-meal-estimate__disclaimer">Portion sizes and invisible ingredients can make a big difference. You'll be able to edit every macro on the next screen before saving.</p>
          <label>Log this as
            <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
              {mealTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <button className="tf-ai-primary" type="button" onClick={reviewMeal}>
            <Save size={18}/> Review and save in Food
          </button>
        </section>
      )}
    </main>
  );
}
