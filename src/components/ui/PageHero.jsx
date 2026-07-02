export default function PageHero({
  eyebrow,
  title,
  children,
  premium = false,
  right,
}) {
  return (
    <section className={premium ? "screen-hero hero-premium" : "screen-hero"}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {right && <div className="hero-right">{right}</div>}
    </section>
  );
}
