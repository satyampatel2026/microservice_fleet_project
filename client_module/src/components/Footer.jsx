
import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#090b12] px-6 pb-8 pt-14 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-3">
        {/* Brand */}
        <div>
          <BrandLogo to="/" size="lg" />

          <p className="mt-5 max-w-sm text-sm leading-7 text-gray-400">
            FLEETROVA connects fleet owners with reliable vehicle
            services and trusted service partners.
          </p>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
            Move • Maintain • Manage
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:justify-self-center">
          <h3 className="mb-6 text-sm font-semibold text-white">
            Quick Links
          </h3>

          <div className="flex flex-col gap-4 text-sm text-gray-400">
            <Link to="/" className="hover:text-white">
              Home
            </Link>

            <Link to="/#features" className="hover:text-white">
              Features
            </Link>

            <Link to="/#how-it-works" className="hover:text-white">
              How It Works
            </Link>

            <Link to="/#about" className="hover:text-white">
              About Us
            </Link>

            <Link to="/#contact" className="hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="mb-6 text-sm font-semibold text-white">
            Get in Touch
          </h3>

          <p className="text-sm leading-7 text-gray-400">
            Have questions about FLEETROVA? We'd love to hear from you.
          </p>

          <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
            <Mail size={18} className="text-violet-400" />
            <span>Contact details coming soon</span>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
            <MapPin size={18} className="text-violet-400" />
            <span>India</span>
          </div>

          <Link
            to="/#contact"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Contact Us <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} FLEETROVA. All rights reserved.
        </p>

        <p>Move. Maintain. Manage.</p>
      </div>
    </footer>
  );
}
