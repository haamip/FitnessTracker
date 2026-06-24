import "./Card.css";

export default function Card({ children, className = "" }) {
  return <section className={`tf-card ${className}`}>{children}</section>;
}
