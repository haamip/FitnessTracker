import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, ImagePlus, Save, Sparkles, UtensilsCrossed } from "lucide-react";
import { estimateMeal, validateMealPhoto } from "../services/ai/mealEstimateClient";
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

  function selectPhoto(event) {
    const candidate = event.target.files?.[0];
    event.target.value = "";
    if (!candidate) return;
    setResult(null);
    try {
      validateMealPhoto(candidate);
      setFile(candidate);
      setStatus("Photo ready. Tap Estimate calories and macros to analyse it.");
    } catch (error) {
      setFile(null);
      setStatus(error instanceof Error ? error.message : "Couldn't select that photo.");
    }
  }

  async function scanMeal() {
    if (loading) return;
    if (mode === "photo" && !file) return setStatus("Take or choose a photo first.");
    if (mode === "homemade" && description.trim().length < 8) return setStatus("Describe the ingredients and approximate amounts.");
    setLoading(true);
    setResult(null);
    setStatus("");
    try {
      const estimate = await estimateMeal({ file: mode === "photo" ? file : null, description, onProgress: setStatus });
      setResult(estimate);
      setStatus(estimate.calories === null || estimate.protein === null
        ? "Estimate received, but some macros are unknown. Add missing values when reviewing."
        : "Estimate ready. Review the numbers below before saving your meal.");
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
            <div className="tf-meal-estimate__pickers" role="group" aria-label="Select a meal photo">
              <label className="tf-ai-file-picker">
                <Camera size={23} aria-hidden="true" />
                <strong>Take photo</strong>
                <input type="file" accept="image/*" capture="environment" disabled={loading} onChange={selectPhoto} aria-label="Take a meal photo with your camera" />
              </label>
              <label className="tf-ai-file-picker">
                <ImagePlus size={23} aria-hidden="true" />
                <strong>Choose photo</strong>
                <input type="file" accept="image/*" disabled={loading} onChange={selectPhoto} aria-label="Choose a meal photo from your phone" />
              </label>
            </div>
            <p className="tf-meal-estimate__photo-help">Supports photos up to 25 MB; TrackFit shrinks the image before analysis. Taking a photo does not save or send it.</p>
            {file && <p className="tf-meal-estimate__selected"><Check size={17} aria-hidden="true" /> Photo selected: <strong>{file.name || "Camera photo"}</strong> ({(file.size / (1024 * 1024)).toFixed(1)} MB)</p>}
            {preview && <img className="tf-ai-preview" src={preview} alt="Selected meal preview" onError={() => setStatus("Preview unavailable. Try a JPEG photo or a screenshot if Estimate can't read it.")} />}
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
