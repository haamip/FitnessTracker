import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Check, FileText, ImagePlus, Save, Sparkles } from "lucide-react";
import { requestMealEstimate } from "../services/ai/mealEstimationClient";
import { getShiftMealTypes } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";
import "./AISuite.css";
import "./MealScanner.css";

export default function MealScanner() {
  const navigate = useNavigate();
  const mealTypes = getShiftMealTypes();
  const [mode, setMode] = useState("photo");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState(mealTypes[0]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function estimateMeal() {
    if (loading) return;
    setLoading(true);
    setStatus("");
    setResult(null);
    try {
      const input = mode === "photo"
        ? { kind: "photo", file }
        : { kind: "description", description };
      setResult(await requestMealEstimate(input));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Meal analysis is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function reviewMeal() {
    if (!result?.canEstimate || result.mode !== "live") return;
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
    <main className="screen tf-ai-suite tf-meal-estimator">
      <section className="tf-ai-hero">
        <Camera size={28} aria-hidden="true" />
        <p className="eyebrow">FOOD · AI ESTIMATES</p>
        <h1>What's for dinner?</h1>
        <p>Take a photo or describe a homemade meal, then review estimated portions and macros before adding it to Food.</p>
      </section>
      <div className="tf-meal-estimator__modes" role="group" aria-label="Choose meal estimate method">
        <button type="button" className={mode === "photo" ? "active" : ""} disabled={loading}
          aria-pressed={mode === "photo"}
          onClick={() => { setMode("photo"); setResult(null); setStatus(""); }}>
          <Camera size={18} /> Photo of meal
        </button>
        <button type="button" className={mode === "description" ? "active" : ""} disabled={loading}
          aria-pressed={mode === "description"}
          onClick={() => { setMode("description"); setResult(null); setStatus(""); }}>
          <FileText size={18} /> Homemade / describe
        </button>
      </div>
      <section className="form-card tf-ai-upload-card">
        {mode === "photo" ? (
          <>
            <label className="tf-ai-file-picker">
              <ImagePlus size={26} />
              <strong>{file ? file.name : "Take or choose a meal photo"}</strong>
              <span>JPG, PNG or WebP · maximum 15 MB · food only</span>
              <input aria-label="Choose meal photo" type="file" accept="image/jpeg,image/png,image/webp"
                capture="environment" onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setResult(null); setStatus("");
                }} />
            </label>
            {preview && <img className="tf-ai-preview" src={preview} alt="Selected meal preview" />}
            <p className="tf-meal-estimator__note">When you tap Estimate, a resized photo is sent securely to OpenAI for analysis. It isn't saved to your TrackFit account or included in progress photos.</p>
          </>
        ) : (
          <label className="tf-meal-estimator__description">
            <strong>Describe what you ate and how much</strong>
            <textarea value={description} rows={5} maxLength={900}
              onChange={(event) => { setDescription(event.target.value); setResult(null); setStatus(""); }}
              placeholder="Example: Homemade beef mince spaghetti. About 150 g cooked mince, 200 g cooked pasta, tomato sauce, a little olive oil and parmesan. One dinner plate." />
            <small>Include portion sizes, cooking oil and sauces where possible. This works for homemade meals without barcodes.</small>
          </label>
        )}
        <button className="tf-ai-primary" type="button" disabled={loading || (mode === "photo" ? !file : description.trim().length < 12)}
          onClick={estimateMeal}>
          <Sparkles size={18} /> {loading ? "Estimating your meal..." : "Estimate calories and macros"}
        </button>
        <small className="tf-meal-estimator__note">AI nutrition is a rough estimate, not a measurement. It uses one request from your daily AI allowance. Nothing is saved until you review and confirm in Food.</small>
        {status && <p className="tf-meal-estimator__error" role="alert">{status}</p>}
      </section>
      {result && (
        <section className="form-card tf-ai-result-card" aria-live="polite">
          <div className="tf-ai-result-heading">
            <div><p className="eyebrow">AI ESTIMATE · REVIEW REQUIRED</p><h2>{result.mealName}</h2></div>
            <span>Confidence {Math.round(result.confidence * 100)}%</span>
          </div>
          <p className="tf-meal-estimator__note">{result.notes || "Estimates can change with portion size, sauces and preparation."}</p>
          {result.canEstimate ? (
            <>
              <div className="tf-ai-macro-grid">
                <article><strong>{Math.round(result.calories)}</strong><span>Estimated kcal</span></article>
                <article><strong>{Math.round(result.protein)}g</strong><span>Protein</span></article>
                <article><strong>{Math.round(result.carbs)}g</strong><span>Carbs</span></article>
                <article><strong>{Math.round(result.fats)}g</strong><span>Fat</span></article>
              </div>
              {result.items.length > 0 && <div className="tf-ai-item-list">
                {result.items.map((item, index) => (
                  <article key={index}><Check size={18} aria-hidden="true" />
                    <div><strong>{item.name}</strong><span>{item.amount || "Portion unknown"} · {item.calories == null ? "Calories unknown" : `${Math.round(item.calories)} kcal`}</span></div>
                  </article>
                ))}
              </div>}
              <label>Log this as
                <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
                  {mealTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <button className="tf-ai-primary" onClick={reviewMeal} type="button">
                <Save size={18} /> Review and save in Food
              </button>
              <p className="tf-meal-estimator__note">You can edit the name, calories, protein, carbs and fat on the next screen before tapping Add meal.</p>
            </>
          ) : (
            <p role="status" className="tf-meal-estimator__error">Couldn't estimate reliably. Try a clearer photo or include ingredients and portion sizes in the description. You can still log the meal manually in <Link to="/nutrition">Food</Link>.</p>
          )}
        </section>
      )}
      <section className="tf-meal-estimator__alternatives">
        <Link to="/nutrition">Prefer a barcode or food-name search? Go back to Food.</Link>
      </section>
    </main>
  );
}
