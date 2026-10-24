import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import BrandLogo from "../BrandLogo";

export default function ClientFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0d1019] px-5 py-3 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand and copyright */}
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo to="/" size="sm" />

          <span className="hidden h-4 w-px bg-white/10 sm:block" />

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} FLEETROVA. All rights reserved.
          </p>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
          <Link to="/" className="transition hover:text-white">
            Home
          </Link>

          <Link to="/#contact" className="transition hover:text-white">
            Contact
          </Link>

          <Link
            to="/client/profile"
            className="transition hover:text-white"
          >
            My Account
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1 font-medium text-violet-300 transition hover:text-violet-200"
          >
            Visit Website
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
        <p className="text-xs text-gray-600">
          Move. Maintain. Manage.
        </p>

        <p className="flex items-center gap-1 text-xs text-gray-600">
          Made with
          <Heart size={11} className="text-violet-400" />
          for better fleet management
        </p>
      </div>
    </footer>
  );
}