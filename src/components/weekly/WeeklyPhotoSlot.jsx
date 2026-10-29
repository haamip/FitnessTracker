import { useEffect, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { deleteWeeklyPhoto, getWeeklyPhoto, putWeeklyPhoto } from "../../services/weeklyPhotos";
import { getWeekStart } from "../../services/weeklyCoachReview";

function shiftWeek(week, offset) {
  const date = new Date(week + "T12:00:00");
  date.setDate(date.getDate() + offset * 7);
  return getWeekStart(date);
}
export default function WeeklyPhotoSlot({ weekStart, angle, refresh, onPhotoChange }) {
  const [image, setImage] = useState("");
  const [previousImage, setPreviousImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const urls = [];
    async function load() {
      try {
        const [current, previous] = await Promise.all([
          getWeeklyPhoto(weekStart, angle),
          getWeeklyPhoto(shiftWeek(weekStart, -1), angle),
        ]);
        if (!active) return;
        const currentUrl = current ? URL.createObjectURL(current.image) : "";
        const previousUrl = previous ? URL.createObjectURL(previous.image) : "";
        if (currentUrl) urls.push(currentUrl);
        if (previousUrl) urls.push(previousUrl);
        setImage(currentUrl);
        setPreviousImage(previousUrl);
      } catch {
        if (active) setError("Photo storage is unavailable on this device.");
      }
    }
    void load();
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [weekStart, angle, refresh]);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await putWeeklyPhoto(weekStart, angle, file);
      onPhotoChange();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Photo could not be saved.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteWeeklyPhoto(weekStart, angle);
      onPhotoChange();
    } catch {
      setError("Photo could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="form-card tf-weekly-photo">
      <h3 className="tf-weekly-photo__title">{angle}</h3>
      <div className="tf-weekly-photo__grid">
        {[["This week", image], ["Last week", previousImage]].map(([heading, url]) => (
          <div className="tf-weekly-photo__column" key={heading}>
            <span className="tf-weekly-photo__caption">{heading}</span>
            <div className="tf-weekly-photo__preview">
              {url
                ? <img src={url} alt={`${angle} progress ${heading.toLowerCase()}`} />
                : <div className="tf-weekly-photo__empty">
                    <Camera aria-hidden="true" size={23} />
                    <span>No photo yet</span>
                  </div>}
            </div>
          </div>
        ))}
      </div>
      <div className="tf-weekly-photo__actions">
        <label className={`tf-weekly-photo__upload${busy ? " is-busy" : ""}`}>
          <Camera size={18} aria-hidden="true" />
          <span>{busy ? "Saving photo..." : image ? "Replace photo" : "Add photo"}</span>
          <input type="file" aria-label={`Upload ${angle} progress photo`}
            accept="image/jpeg,image/png,image/webp"
            onChange={upload} disabled={busy} />
        </label>
        {image && (
          <button className="tf-weekly-photo__delete" type="button" disabled={busy} onClick={remove}>
            <Trash2 size={16} aria-hidden="true" /> Delete photo
          </button>
        )}
      </div>
      {error && <p className="tf-weekly-photo__error" role="alert">{error}</p>}
    </article>
  );
}

