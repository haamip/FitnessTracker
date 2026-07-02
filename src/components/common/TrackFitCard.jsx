/**
 * ============================================================================
 * TrackFitCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ----------
 * 3/5
 * PURPOSE
 * -------
 * This is a reusable card component.
 *
 * Instead of rewriting card HTML over and over, we use this one component
 * across Coach, Dashboard, Progress, Settings, etc.
 *
 * Think of it like a template.
 *
 * Example:
 *
 * <TrackFitCard title="Readiness" eyebrow="Coach">
 *   <p>84% ready</p>
 * </TrackFitCard>
 *
 * ============================================================================
 */

export default function TrackFitCard({
  eyebrow,
  title,
  icon,
  children,
  className = "",
}) {
  return (
    <section className={`trackfit-card ${className}`}>
      {(eyebrow || title || icon) && (
        <header className="trackfit-card__header">
          <div>
            {eyebrow && <p className="trackfit-card__eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>

          {icon && <div className="trackfit-card__icon">{icon}</div>}
        </header>
      )}

      <div className="trackfit-card__body">{children}</div>
    </section>
  );
}
