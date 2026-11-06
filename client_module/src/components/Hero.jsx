import DashboardPreview from "./DashboardPreview";
import { useEffect, useState } from "react";

const banners = [
  {
    image: "/fleetrova-hero-road.png",
    alt: "FLEETROVA sunset highway fleet banner",
    title: "Your fleet. Your journey.",
    highlight: "One connected platform.",
    description: "Discover vehicle services and connect with service partners through FLEETROVA.",
    tag: "MOVE. MAINTAIN. MANAGE.",
  },
  {
    image: "/fleetrova-hero-city.png",
    alt: "FLEETROVA city highway fleet banner",
    title: "Keep your business moving.",
    highlight: "Make every service simpler.",
    description: "Explore maintenance, inspection and fleet assistance services, all in one place.",
    tag: "SERVICES THAT MOVE WITH YOU",
  },
  {
    image: "/fleetrova-hero-workshop.png",
    alt: "FLEETROVA commercial vehicle workshop",
    title: "Better care for every vehicle.",
    highlight: "Find the right service partner.",
    description: "Explore vehicle maintenance services and discover service partners for your fleet's everyday needs.",
    tag: "VEHICLE MAINTENANCE · SERVICE PARTNERS",
  },
  {
    image: "/fleetrova-hero-convoy.png",
    alt: "FLEETROVA fleet convoy on an expressway",
    title: "Every vehicle has a journey.",
    highlight: "Bring your fleet together.",
    description: "Find vehicle services through FLEETROVA and connect your business with the people who help keep it moving.",
    tag: "CONNECTED FLEETS · SIMPLER SERVICE DISCOVERY",
  },
  {
    image: "/fleetrova-hero-inspection.png",
    alt: "FLEETROVA vehicle inspection team",
    title: "Give your vehicles attention.",
    highlight: "Explore inspection services.",
    description: "Discover inspection and maintenance services to support your vehicle care, with partner details available in one place.",
    tag: "VEHICLE INSPECTION · MAINTENANCE SUPPORT",
  },
  {
    image: "/fleetrova-hero-logistics.png",
    alt: "FLEETROVA logistics hub at twilight",
    title: "Your business keeps moving.",
    highlight: "Your services should too.",
    description: "From workshop maintenance to fleet assistance, explore the services that fit your commercial vehicle operations.",
    tag: "COMMERCIAL VEHICLES · FLEET ASSISTANCE",
  },
];

// Har slide par title, phir highlight ek-ek character karke type hota hai.
function TypewriterHeading({ title, highlight, reduceMotion, tabHidden }) {
  const [typedCount, setTypedCount] = useState(0);
  const titleLetters = Array.from(title);
  const highlightLetters = Array.from(highlight);
  const total = titleLetters.length + highlightLetters.length;
  const visibleCount = reduceMotion ? total : typedCount;
  const titleText = titleLetters.slice(0, visibleCount).join("");
  const highlightText = highlightLetters.slice(0, Math.max(0, visibleCount - titleLetters.length)).join("");
  const typingTitle = visibleCount < titleLetters.length;
  const typing = visibleCount < total;

  useEffect(() => {
    if (reduceMotion || tabHidden) return;
    const timer = window.setInterval(() => {
      setTypedCount((count) => {
        if (count + 1 >= total) window.clearInterval(timer);
        return Math.min(count + 1, total);
      });
    }, 30); // Typing speed: chhota number = faster typing.
    return () => window.clearInterval(timer);
  }, [reduceMotion, tabHidden, total]);

  const cursor = <span className="ml-0.5 inline-block h-[0.85em] w-[2px] translate-y-[0.08em] bg-violet-300" />;

  return (
    <h1 className="relative mt-3 text-[clamp(1.5rem,2.7vw,2.8rem)] font-semibold leading-[1.12] tracking-tight">
      {/* Screen readers ko poori heading ek saath milegi. */}
      <span className="sr-only">{title} {highlight}</span>
      {/* Full text ki jagah reserved: typing ke waqt layout jump nahi karega. */}
      <span aria-hidden="true" className="invisible block">
        {title}<span className="mt-2 block text-violet-200">{highlight}</span>
      </span>
      <span aria-hidden="true" className="absolute inset-0 block">
        {titleText}{typing && typingTitle && cursor}
        <span className="mt-2 block text-violet-200">
          {highlightText}{typing && !typingTitle && cursor}
        </span>
      </span>
    </h1>
  );
}
export default function Hero() {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(preference.matches);
    const updateVisibility = () => setTabHidden(document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || tabHidden) return;
    // Manual dot click ke baad bhi selected image poore 4 seconds dikhegi.
    const timer = setTimeout(() => setActive((current) => (current + 1) % banners.length), 4000);
    return () => clearTimeout(timer);
  }, [active, reduceMotion, tabHidden]);

  useEffect(() => {
    const nextImage = new Image();
    nextImage.src = banners[(active + 1) % banners.length].image;
  }, [active]);

  const banner = banners[active];
  const imageHeight = "h-[220px] sm:h-[320px] lg:h-[420px] xl:h-[460px]";

  return (
    <section id="home" aria-label="FLEETROVA highlights" className="relative overflow-hidden bg-[#090b12] text-white">
      <div role="region" aria-roledescription="carousel" aria-label="FLEETROVA banners" className="relative isolate overflow-hidden">
        {/* Background sirf decoration hai. Main image contain hai, isliye nahi kategi. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img src={banner.image} alt="" className="h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
          <div className="absolute inset-0 bg-[#090b12]/60" />
        </div>

        <div aria-roledescription="slide" aria-label={`${active + 1} of ${banners.length}`} className={banner.title ? "mx-auto grid max-w-[1600px] md:grid-cols-[38%_62%]" : "w-full"}>
          {/* Har image se related project content, buttons ke bina. */}
          {banner.title && (
            <div className="order-2 flex items-center px-6 pb-12 pt-4 md:order-1 md:py-8 lg:pl-10 xl:pl-14">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">FLEETROVA</p>
                <TypewriterHeading key={banner.image} title={banner.title} highlight={banner.highlight} reduceMotion={reduceMotion} tabHidden={tabHidden} />
                <p className="mt-4 max-w-md text-xs leading-6 text-slate-300 lg:text-sm">{banner.description}</p>
                <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-slate-400">{banner.tag}</p>
              </div>
            </div>
          )}
          <div className={`${imageHeight} relative ${banner.title ? "order-1 md:order-2" : ""}`}>
            <img src={banner.image} alt={banner.alt} fetchPriority={active === 0 ? "high" : "auto"} decoding="async" className="block h-full w-full object-contain object-center" />
          </div>
        </div>

        {/* Chhote dots, lekin click/touch area comfortably bada hai. */}
        <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-white/10 bg-black/25 px-1.5 backdrop-blur-sm" aria-label="Choose banner">
          {banners.map((item, index) => (
            <button key={item.image} type="button" onClick={() => setActive(index)} aria-label={`View banner ${index + 1}`} aria-current={active === index ? "true" : undefined} className="flex h-8 w-7 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">
              <span className={`block h-1.5 w-1.5 rounded-full transition-colors ${active === index ? "bg-violet-300 ring-2 ring-violet-300/25" : "bg-white/45 hover:bg-white/80"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Overview same rahega. */}
      <div className="relative border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-950/15 to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.03] p-1.5 shadow-2xl shadow-violet-950/30 sm:rounded-[2rem] sm:p-2.5">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

