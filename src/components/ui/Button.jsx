export default function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`tf-button tf-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}