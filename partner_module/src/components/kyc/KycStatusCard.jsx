
import {
  Clock3,
  ShieldCheck,
  ShieldX,
  AlertCircle,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pending Verification",
    description: "Your documents are awaiting verification.",
    color: "border-amber-200 bg-[#FFFBF2]",
    iconBg: "bg-amber-100 text-amber-700",
    textColor: "text-amber-800",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    Icon: Clock3,
  },

  verified: {
    label: "Verified",
    description: "Your documents have been verified.",
    color: "border-emerald-200 bg-[#EDF9F6]",
    iconBg: "bg-emerald-100 text-teal-700",
    textColor: "text-[#0E5957]",
    badge: "border-emerald-200 bg-white text-teal-700",
    dot: "bg-emerald-500",
    Icon: ShieldCheck,
  },

  rejected: {
    label: "Rejected",
    description: "Please review and resubmit your documents.",
    color: "border-red-200 bg-red-50",
    iconBg: "bg-red-100 text-red-600",
    textColor: "text-red-800",
    badge: "border-red-200 bg-white text-red-700",
    dot: "bg-red-500",
    Icon: ShieldX,
  },
};

const KycStatusCard = ({ status, rejectionReason }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.Icon;

  return (
    <div className="space-y-3">
      {/* STATUS CARD */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_3px_14px_rgba(7,27,34,0.025)] sm:px-5 ${config.color}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
          >
            <StatusIcon size={19} />
          </div>

          <div className="min-w-0">
            <p
              className={`text-[12px] font-bold ${config.textColor}`}
            >
              KYC Status
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-slate-600">
              {config.description}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${config.badge}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
          />
          {config.label}
        </span>
      </div>

      {/* REJECTION REASON */}
      {status === "rejected" && rejectionReason && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 sm:px-5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-bold text-red-800">
              Rejection Reason
            </p>

            <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-red-700">
              {rejectionReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycStatusCard;
