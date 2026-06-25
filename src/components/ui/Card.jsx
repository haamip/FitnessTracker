export default function Card({ children, className = "" }) {
  return <section className={`tf-card ${className}`.trim()}>{children}</section>;
}