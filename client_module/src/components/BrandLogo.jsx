
import { Link } from "react-router-dom";

export default function BrandLogo({
  to = "/",
  size = "md",
  showTagline = false,
  className = "",
}) {
  const sizes = {
    sm: "h-10",
    md: "h-14",
    lg: "h-20",
  };

  return (
    <Link
      to={to}
      aria-label="Fleetrova Home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src="/fleetrova-logo.png"
        alt="Fleetrova"
        className={`${sizes[size] || sizes.md} max-w-full object-contain`}
      />

      {showTagline && (
        <span className="sr-only">
          Move. Maintain. Manage.
        </span>
      )}
    </Link>
  );
}
