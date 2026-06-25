export default function PageHero({ eyebrow, title, children, premium = false }) {
  return (
    <section className={premium ? "screen-hero hero-premium" : "screen-hero"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </section>
  );
}