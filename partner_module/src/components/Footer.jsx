
import React from "react";
import {
  Heart,
  ShieldCheck,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";

const links = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Documentation", href: "/docs" },
  { label: "Support", href: "/support" },
];

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#E4ECEA] bg-white/95">
      <div className="px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-col items-center justify-between gap-3 xl:flex-row xl:gap-5">

          {/* COPYRIGHT */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-slate-500 xl:justify-start">
            <span>
              © {new Date().getFullYear()}{" "}
              <span className="font-extrabold tracking-tight text-[#092B31]">
                FLEET<span className="text-teal-600">ROVA</span>
              </span>
              . All rights reserved.
            </span>

            <span className="hidden text-slate-300 sm:inline">
              |
            </span>

            <span className="hidden items-center gap-1 sm:inline-flex">
              Crafted with
              <Heart
                size={12}
                className="fill-rose-500 text-rose-500"
              />
              for partners
            </span>
          </div>

          {/* FOOTER LINKS */}
          <nav
  aria-label="Footer navigation"
  className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
>
  {links.map((link) => (
    <span
      key={link.label}
      className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"
    >
      {link.label}
    </span>
  ))}
</nav>
          {/* SECURITY STATUS */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-[#F0FAF7] px-2.5 py-1.5">
              <LockKeyhole
                size={12}
                className="text-teal-700"
              />

              <span className="text-[10px] font-semibold text-teal-800">
                Secure Partner Portal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
