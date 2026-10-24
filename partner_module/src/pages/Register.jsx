import { useState,useEffect,useRef } from "react";
import { registerPartner,getPartnerServiceCatalog } from "../services/partnerService";
import { Link, useNavigate } from "react-router-dom";
import TurnstileCaptcha from "../components/TurnstileCaptcha";
import { useFormik } from "formik";
import { ArrowRight,ArrowUpRight,Check,ChevronDown,Eye,EyeOff,Loader2,LockKeyhole,Mail,Phone,ShieldCheck
  ,Sparkles,Truck,UserRound,X,BriefcaseBusiness,BarChart3,UsersRound,Wallet } from "lucide-react";
import * as Yup from "yup";
import Swal from "sweetalert2";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [categories, setCategories] = useState([]);
const [catalogLoading, setCatalogLoading] = useState(true);
const [catalogError, setCatalogError] = useState("");
const [selectedCategoryId, setSelectedCategoryId] = useState("");
const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);

const servicesDropdownRef = useRef(null);
const categoryDropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      servicesDropdownRef.current &&
      !servicesDropdownRef.current.contains(event.target)
    ) {
      setServicesDropdownOpen(false);
    }

    if (
      categoryDropdownRef.current &&
      !categoryDropdownRef.current.contains(event.target)
    ) {
      setCategoryDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("touchstart", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("touchstart", handleClickOutside);
  };
}, []);
   const navigate = useNavigate();
   useEffect(() => {
  const loadCatalog = async () => {
    try {
      const response = await getPartnerServiceCatalog();

      setCategories(response.data || []);
      if (response.data?.length > 0) {
  setSelectedCategoryId(
    String(response.data[0].category_id)
  );
}
      setCatalogError("");
    } catch (error) {
      setCatalogError(error.message);
    } finally {
      setCatalogLoading(false);
    }
  };

  loadCatalog();
}, []);
  const formik = useFormik({
    initialValues: {
      partnername: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      service_ids: [],
    },

    validationSchema: Yup.object({
      partnername: Yup.string()
        .trim()
        .required("Partner Name is required"),

      email: Yup.string()
        .trim()
        .email("Enter a valid email")
        .required("Email is required"),

      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
        .required("Mobile number is required"),

      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),

      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("password")],
          "Passwords do not match"
        )
        .required("Confirm Password is required"),

        service_ids: Yup.array()
  .of(Yup.number().integer().positive())
  .min(1, "Select at least one service")
  .required("Please select a service"),
    }),

    onSubmit: async (values, { resetForm }) => {
  if (!captchaToken) {
    Swal.fire({
      icon: "warning",
      title: "Security Verification Required",
      text: "Please complete CAPTCHA verification.",
      confirmButtonColor: "#0F766E",
    });
    return;
  }

  try {
    const partnerData = {
      partnername: values.partnername,
      email: values.email,
      mobile: values.mobile,
      password: values.password,
      service_ids: values.service_ids,
      captchaToken,
    };

    const response = await registerPartner(partnerData);

    await Swal.fire({
      icon: "success",
      title: "Registration Successful",
      text:
        response?.message ||
        "Your partner account has been created.",
      confirmButtonColor: "#0F766E",
    });

    resetForm();
    navigate("/login", { replace: true });
  } catch (error) {
    console.error("Registration Error:", error);

    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text:
        error.message ||
        "Something went wrong. Please try again.",
      confirmButtonColor: "#0F766E",
    });
  } finally {
    setCaptchaToken("");
    captchaRef.current?.reset();
  }
},

  });

  // Only numbers allow
  const handleMobileChange = (e) => {
    const value = e.target.value;

    // Remove anything except numbers
    const onlyNumbers = value.replace(/\D/g, "");

    // Maximum 10 digits
    formik.setFieldValue(
      "mobile",
      onlyNumbers.slice(0, 10)
    );
  };
const handleServiceChange = (serviceId) => {
  const selectedIds = [...formik.values.service_ids];

  if (selectedIds.includes(serviceId)) {
    const updatedIds = selectedIds.filter(
      (id) => id !== serviceId
    );

    formik.setFieldValue("service_ids", updatedIds);
  } else {
    if (selectedIds.length >= 100) return;

    selectedIds.push(serviceId);
    formik.setFieldValue("service_ids", selectedIds);
  }
};
const selectedCategory = categories.find(
  (category) =>
    String(category.category_id) === selectedCategoryId
);
  
return (
  <div className="min-h-screen bg-[#F5F8F7] font-sans text-slate-900">
    <style>{`
      @keyframes registerFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes registerFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes registerGlow {
        0%, 100% { opacity: .3; transform: scale(1); }
        50% { opacity: .6; transform: scale(1.12); }
      }
      .register-enter {
        animation: registerFadeUp .65s ease-out both;
      }
      .register-float {
        animation: registerFloat 6s ease-in-out infinite;
      }
      .register-glow {
        animation: registerGlow 9s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .register-enter, .register-float, .register-glow {
          animation: none !important;
        }
      }
    `}</style>

    <div className="flex min-h-screen">
      {/* LEFT BRAND PANEL */}
      <aside className="relative hidden w-[43%] flex-col overflow-hidden bg-[#071B22] px-9 py-10 text-white lg:flex xl:px-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="register-glow absolute -left-32 top-32 h-96 w-96 rounded-full bg-teal-500/20 blur-[110px]" />
          <div className="register-glow absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/fleetrova-logo.png"
            alt="FLEETROVA"
            className="h-14 w-auto max-w-[220px] object-contain"
          />
          <div className="border-l border-white/20 pl-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">
              Partner Portal
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Business Workspace
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-3 py-2 text-[10px] font-bold tracking-wide text-teal-300">
            <Sparkles size={13} />
            GROW WITH FLEETROVA
          </div>

          <h1 className="max-w-lg text-[clamp(2.4rem,3.6vw,4rem)] font-bold leading-[1.12] tracking-[-0.045em]">
            Your business.
            <span className="mt-1 block bg-gradient-to-r from-teal-300 via-emerald-400 to-[#D6B77B] bg-clip-text text-transparent">
              More possibilities.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
            Join the FLEETROVA partner network and manage
            your services, team and business operations
            from one powerful workspace.
          </p>

          <div className="register-float mt-10 rounded-[24px] border border-white/[0.12] bg-white/[0.07] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Your partner workspace
                </h3>
                <p className="text-[11px] text-slate-400">
                  Everything your business needs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck, text: "Manage services" },
                { icon: UsersRound, text: "Manage employees" },
                { icon: Wallet, text: "Track expenses" },
                { icon: BarChart3, text: "Business insights" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-3.5"
                >
                  <Icon size={17} className="shrink-0 text-teal-300" />
                  <span className="text-[11px] font-medium text-slate-200">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-400/[0.08] px-3 py-3 text-xs text-emerald-300">
              <ShieldCheck size={16} />
              A smarter way to manage your operations
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-5 text-[11px] text-slate-500">
          © 2026 FLEETROVA · Partner Workspace
        </div>
      </aside>

      {/* RIGHT REGISTRATION PANEL */}
      <main className="w-full lg:w-[57%]">
        {/* Mobile Logo */}
        <div className="flex items-center gap-3 px-5 pt-6 lg:hidden">
          <img
            src="/fleetrova-icon.png"
            alt="FLEETROVA"
            className="h-11 w-11 rounded-xl object-contain"
          />
          <div>
            <p className="text-lg font-extrabold tracking-tight text-[#092B31]">
              FLEET<span className="text-teal-600">ROVA</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Partner Portal
            </p>
          </div>
        </div>

        <div className="flex min-h-screen justify-center px-4 py-9 sm:px-8 lg:px-10 xl:px-14">
          <div className="register-enter w-full max-w-[560px]">
            {/* Heading */}
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Partner Registration
              </div>

              <h3 className="text-[25px] font-bold tracking-[-0.035em] text-[#092B31] sm:text-[29px]">
                Create partner account<span className="text-teal-600">.</span>
              </h3>

              <p className="mt-1.5 text-[13px] text-slate-500">
                Set up your business profile and choose the services you provide.
              </p>
            </div>

            {/* Registration Card */}
           <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(13,55,55,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_35px_rgba(13,55,55,0.11)] sm:p-5">
              <form onSubmit={formik.handleSubmit} noValidate>
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <UserRound size={16} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#092B31]">
                      Account information
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Enter your partner details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
                  {/* Partner Name */}
                  <div>
                    <label
                      htmlFor="partnername"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Partner Name
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <UserRound size={17} />
                      </span>

                      <input
                        id="partnername"
                        type="text"
                        name="partnername"
                        placeholder="Enter partner name"
                        value={formik.values.partnername}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-12 w-full rounded-xl border bg-[#F8FAFA] py-3 pl-11 pr-3 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                          formik.touched.partnername && formik.errors.partnername
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />
                    </div>

                    {formik.touched.partnername && formik.errors.partnername && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formik.errors.partnername}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Partner Email
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <Mail size={17} />
                      </span>

                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Enter partner email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-12 w-full rounded-xl border bg-[#F8FAFA] py-3 pl-11 pr-3 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                          formik.touched.email && formik.errors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />
                    </div>

                    {formik.touched.email && formik.errors.email && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formik.errors.email}
                      </p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label
                      htmlFor="mobile"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Partner Mobile Number
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <Phone size={17} />
                      </span>

                      <input
                        id="mobile"
                        type="tel"
                        name="mobile"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="10 digit mobile number"
                        value={formik.values.mobile}
                        onChange={handleMobileChange}
                        onBlur={formik.handleBlur}
                        className={`h-12 w-full rounded-xl border bg-[#F8FAFA] py-3 pl-11 pr-3 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                          formik.touched.mobile && formik.errors.mobile
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />
                    </div>

                    {formik.touched.mobile && formik.errors.mobile && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formik.errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <LockKeyhole size={17} />
                      </span>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-12 w-full rounded-xl border bg-[#F8FAFA] py-3 pl-11 pr-11 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                          formik.touched.password && formik.errors.password
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-teal-700"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {formik.touched.password && formik.errors.password && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {formik.errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <LockKeyhole size={17} />
                      </span>

                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-12 w-full rounded-xl border bg-[#F8FAFA] py-3 pl-11 pr-11 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                          formik.touched.confirmPassword && formik.errors.confirmPassword
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-teal-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    {formik.touched.confirmPassword &&
                      formik.errors.confirmPassword && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {formik.errors.confirmPassword}
                        </p>
                      )}
                  </div>
                </div>

                {/* Services Section */}
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <BriefcaseBusiness size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#092B31]">
                        Services You Provide
                        <span className="ml-1 text-red-500">*</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Select the categories and services your business offers.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-teal-100/70 bg-[#F8FBFA] p-4">
                    {/* Category Dropdown */}
                    <div className="relative" ref={categoryDropdownRef}>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Service Category
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setCategoryDropdownOpen((prev) => !prev)
                        }
                        disabled={catalogLoading || Boolean(catalogError)}
                        aria-expanded={categoryDropdownOpen}
                        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-700 transition-all hover:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                      >
                        <span className="min-w-0 truncate">
                          {catalogLoading
                            ? "Loading categories..."
                            : selectedCategory?.category_name ||
                              "Select a category"}
                        </span>
                        <ChevronDown
                          size={17}
                          className={`shrink-0 text-teal-700 transition-transform ${
                            categoryDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {categoryDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
                          <div className="max-h-44 overflow-y-auto p-1.5">
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <button
                                  key={category.category_id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategoryId(
                                      String(category.category_id)
                                    );
                                    setCategoryDropdownOpen(false);
                                    setServicesDropdownOpen(false);
                                  }}
                                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-teal-50 ${
                                    String(category.category_id) ===
                                    selectedCategoryId
                                      ? "bg-teal-50 font-semibold text-teal-800"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {category.category_name}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-xs text-slate-500">
                                No categories available.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {catalogError && (
                      <p className="text-xs text-red-600" role="alert">
                        {catalogError}
                      </p>
                    )}

                    {!catalogLoading &&
                      !catalogError &&
                      categories.length === 0 && (
                        <p className="text-xs text-slate-500">
                          No service categories are currently available.
                        </p>
                      )}

                    {/* Services Dropdown */}
                    {selectedCategory && (
                      <div className="relative" ref={servicesDropdownRef}>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Select Services
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setServicesDropdownOpen((prev) => !prev)
                          }
                          aria-expanded={servicesDropdownOpen}
                          className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-700 transition-all hover:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                        >
                          <span className="min-w-0 truncate">
                            {selectedCategory.services?.filter((service) =>
                              formik.values.service_ids.includes(
                                service.service_id
                              )
                            ).length > 0
                              ? `${
                                  selectedCategory.services.filter((service) =>
                                    formik.values.service_ids.includes(
                                      service.service_id
                                    )
                                  ).length
                                } services selected`
                              : "Choose services"}
                          </span>

                          <ChevronDown
                            size={17}
                            className={`shrink-0 text-teal-700 transition-transform ${
                              servicesDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {servicesDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
                            <div className="max-h-44 overflow-y-auto p-1.5">
                              {selectedCategory.services?.length > 0 ? (
                                selectedCategory.services.map((service) => (
                                  <label
                                    key={service.service_id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-teal-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formik.values.service_ids.includes(
                                        service.service_id
                                      )}
                                      onChange={() =>
                                        handleServiceChange(
                                          service.service_id
                                        )
                                      }
                                      onBlur={() =>
                                        formik.setFieldTouched(
                                          "service_ids",
                                          true
                                        )
                                      }
                                      className="h-4 w-4 shrink-0 accent-teal-700"
                                    />
                                    <span className="text-sm text-slate-700">
                                      {service.service_name}
                                    </span>
                                  </label>
                                ))
                              ) : (
                                <p className="px-3 py-2 text-xs text-slate-500">
                                  No services available in this category.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Services */}
                  {formik.values.service_ids.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-600">
                        Selected Services ({formik.values.service_ids.length})
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) =>
                          (category.services || []).map((service) =>
                            formik.values.service_ids.includes(
                              service.service_id
                            ) ? (
                              <span
                                key={service.service_id}
                                className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800"
                              >
                                <Check size={12} />
                                {service.service_name}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleServiceChange(service.service_id)
                                  }
                                  aria-label={`Remove ${service.service_name}`}
                                  className="rounded-full p-0.5 transition-colors hover:bg-red-100 hover:text-red-600"
                                >
                                  <X size={13} />
                                </button>
                              </span>
                            ) : null
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {formik.touched.service_ids &&
                    formik.errors.service_ids && (
                      <p className="mt-2 text-xs text-red-600" role="alert">
                        {formik.errors.service_ids}
                      </p>
                    )}
                </div>
                {/* CAPTCHA VERIFICATION */}
<div className="mt-4 flex flex-col items-center gap-1.5 rounded-lg border border-teal-100 bg-[#F8FBFA] px-3 py-3">
  <TurnstileCaptcha
    ref={captchaRef}
    onVerify={setCaptchaToken}
  />
  <p className="text-center text-[11px] text-slate-500">
    Security verification helps protect FLEETROVA
    from automated registrations.
  </p>
</div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    formik.isSubmitting ||
                    !captchaToken ||
                    catalogLoading ||
                    Boolean(catalogError) ||
                    categories.length === 0
                  }
                  className="group mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(15,118,110,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,118,110,0.34)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formik.isSubmitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Partner Account
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Already have a partner account?{" "}
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900"
                  >
                    Log In
                    <ArrowUpRight size={13} />
                  </Link>
                </p>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-teal-600" />
              FLEETROVA Partner Registration
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
};

export default Register;
