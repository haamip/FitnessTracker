import { useState } from "react";
import { FileUp, ClipboardPaste, AlertTriangle } from "lucide-react";
import { parseMealPlanText } from "../services/mealPlanImporter";
import "./MealPlanImportPanel.css";

async function extractTextFromPdf(file) {
  if (file.size > 4 * 1024 * 1024) throw new Error("Choose a PDF smaller than 4 MB.");
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  if (doc.numPages > 15) throw new Error("Please use a PDF with 15 pages or fewer.");
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str + (item.hasEOL ? "\n" : " ")).join(""));
  }
  const text = pages.join("\n").trim();
  if (!text) throw new Error("This looks like a scanned PDF. Copy the meal text or use a text-based PDF.");
  return text;
}

export default function MealPlanImportPanel({ onImport, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function readFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setWorking(true);
    setMessage("");
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("Limit imports to 4 MB.");
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".txt")) throw new Error("Choose a .pdf or .txt meal plan.");
      const text = lower.endsWith(".pdf") ? await extractTextFromPdf(file) : await file.text();
      setSource(text.slice(0, 20000));
      setFileName(file.name);
      setMessage("File read on this device. Review the extracted text, then tap Import into editor.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read that file.");
    } finally { setWorking(false); }
  }

  function importDraft() {
    const { meals, reviewCount, truncated } = parseMealPlanText(source);
    if (!meals.length) {
      setMessage("No meal entries detected. Try one per line: Breakfast: Oats | 480 kcal | P 35g | C 60g | F 12g");
      return;
    }
    if (!onImport(meals, fileName)) {
      setMessage("Import cancelled. Your existing meal plan has not changed.");
      return;
    }
    setExpanded(false);
    // No plan is saved to the cloud until the user checks values and taps Save.
    setMessage((truncated ? "First 20 meals imported. " : "") +
      (reviewCount ? reviewCount + " meal(s) missing calories or protein — complete them before saving." : "Meals added to editor. Review before saving."));
  }

  return (
    <section className="tf-meal-import" aria-label="Import meal plan">
      <button type="button" className="tf-meal-import-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        <FileUp size={20}/> Import meal plan {expanded ? "−" : "+"}
      </button>
      {expanded && (
        <div className="tf-meal-import-inner">
          <p>Paste your daily meal plan, upload a text PDF, or choose a .txt file. Macros must be written in the plan — TrackFit won't guess them.</p>
          <p className="tf-meal-import-example">Breakfast: Oats and banana | 480 kcal | P 35g | C 60g | F 12g</p>
          <label>Paste meal plan
            <textarea aria-label="Paste meal plan" value={source} onChange={e => setSource(e.target.value)}
              rows={7} maxLength={20000} placeholder={"Breakfast: Oats | 480 kcal | Protein 35g\nLunch: Chicken and rice | 650 kcal | P 50g | C 70g | F 18g"} />
          </label>
          <label className="tf-meal-import-file"><FileUp size={18}/> {fileName || "Choose PDF or text file"}
            <input type="file" aria-label="Upload meal plan file" accept=".pdf,.txt,application/pdf,text/plain" onChange={readFile} disabled={working||disabled}/>
          </label>
          <button type="button" className="tf-meal-import-action" disabled={working||disabled||!source.trim()} onClick={importDraft}>
            <ClipboardPaste size={18}/>{working?"Reading file...":"Import into meal editor"}
          </button>
          <small><AlertTriangle size={14}/> Check the portion sizes and macros before saving. PDFs are processed on your device, not sent to AI.</small>
        </div>
      )}
      {message && <p role="status" className="tf-meal-import-status">{message}</p>}
    </section>
  );
}