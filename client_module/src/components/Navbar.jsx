import BrandLogo from "./BrandLogo";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/#features" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "About Us", href: "/#about" },
  { name: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setOpen(false);

  const handleNavigation = (event, href) => {
  closeMenu();

  if (location.pathname !== "/") return;

  if (href === "/") {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (href.startsWith("/#")) {
    event.preventDefault();
    const sectionId = href.slice(2);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#090b12]/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">
        {/* Logo */}
        {/* FLEETROVA Logo */}
<BrandLogo to="/" size="md" className="shrink-0" />

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={(event) =>
                handleNavigation(event, item.href)
              }
              className="text-sm font-medium text-gray-400 transition hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-violet-200"
          >
            Get Started
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className="rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-white/10 bg-[#090b12] px-6 py-6 lg:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(event) =>
                  handleNavigation(event, item.href)
                }
                className="text-sm font-medium text-gray-300 transition hover:text-violet-300"
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-medium text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="rounded-xl bg-violet-500 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
