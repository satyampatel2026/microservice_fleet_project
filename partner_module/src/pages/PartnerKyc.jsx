import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

import Layout from "../layouts/Layout";
import KycStatusCard from "../components/kyc/KycStatusCard";
import KycDetails from "../components/kyc/kycDetails";
import KycFormModal from "../components/kyc/kycFormModal";

import {
    getPartnerKyc,
    submitPartnerKyc
} from "../services/PartnerKycApi";

import {
    emptyForm,
    validateFile
} from "../utils/kycUtils";

const validationSchema = Yup.object({
    owner_name: Yup.string()
        .trim()
        .required("Owner name is required.")
        .min(2, "Owner name must be at least 2 characters.")
        .max(100, "Owner name cannot exceed 100 characters.")
        .matches(
            /^[A-Za-z\s.'-]+$/,
            "Owner name can contain only letters and spaces."
        ),

    business_name: Yup.string()
        .trim()
        .required("Business name is required.")
        .min(2, "Business name must be at least 2 characters.")
        .max(150, "Business name cannot exceed 150 characters."),

    business_address: Yup.string()
        .trim()
        .required("Business address is required.")
        .min(10, "Business address must be at least 10 characters.")
        .max(500, "Business address cannot exceed 500 characters."),

    pan_number: Yup.string()
        .trim()
        .uppercase()
        .required("PAN number is required.")
        .matches(
            /^[A-Z]{5}[0-9]{4}[A-Z]$/,
            "Enter a valid PAN number."
        ),

    gst_number: Yup.string()
        .trim()
        .uppercase()
        .required("GST number is required.")
        .matches(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
            "Enter a valid GST number."
        ),

    aadhaar_number: Yup.string()
        .trim()
        .required("Aadhaar number is required.")
        .matches(
            /^[0-9]{12}$/,
            "Aadhaar number must be exactly 12 digits."
        ),

    pan_document: Yup.mixed().test(
        "pan-document",
        "PAN document must be PDF, JPG or PNG and max 5 MB.",
        validateFile
    ),

    aadhaar_document: Yup.mixed().test(
        "aadhaar-document",
        "Aadhaar document must be PDF, JPG or PNG and max 5 MB.",
        validateFile
    ),

    gst_document: Yup.mixed().test(
        "gst-document",
        "GST document must be PDF, JPG or PNG and max 5 MB.",
        validateFile
    )
});

const useAutoHideMessage = (message, setMessage, delay = 2000) => {
    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, delay);

        return () => clearTimeout(timer);
    }, [message, setMessage, delay]);
};

const AlertMessage = ({ type, message }) => {
    if (!message) return null;

    const success = type === "success";

    return (
        <div
            className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
            <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
                    success ? "bg-emerald-100" : "bg-red-100"
                }`}
            >
                {success ? "✓" : "!"}
            </span>

            <span>{message}</span>
        </div>
    );
};

const PartnerKyc = () => {
    const [kyc, setKyc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [modalError, setModalError] = useState("");
    const [editModal, setEditModal] = useState(false);

    useAutoHideMessage(success, setSuccess);

    const hasKyc = Boolean(kyc?.kyc_id && kyc?.partner_id);
    const isVerified = kyc?.kyc_status === "verified";

    const loadKyc = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getPartnerKyc();

            if (
                response?.success === true &&
                response?.data?.kyc_id
            ) {
                const data = response.data;

                const savedKyc = {
                    kyc_id: data.kyc_id,
                    partner_id: data.partner_id,
                    owner_name: data.owner_name || "",
                    business_name: data.business_name || "",
                    business_address: data.business_address || "",
                    pan_number: data.pan_number || "",
                    gst_number: data.gst_number || "",
                    aadhaar_number: data.aadhaar_number || "",
                    pan_document: data.pan_document || "",
                    aadhaar_document: data.aadhaar_document || "",
                    gst_document: data.gst_document || "",
                    kyc_status: data.kyc_status || "pending",
                    rejection_reason: data.rejection_reason || null,
                    submitted_at: data.submitted_at || null,
                    verified_at: data.verified_at || null
                };

                setKyc(savedKyc);

                formik.setValues({
                    owner_name: savedKyc.owner_name,
                    business_name: savedKyc.business_name,
                    business_address: savedKyc.business_address,
                    pan_number: savedKyc.pan_number,
                    gst_number: savedKyc.gst_number,
                    aadhaar_number: savedKyc.aadhaar_number,
                    pan_document: null,
                    aadhaar_document: null,
                    gst_document: null
                });
            } else {
                setKyc(null);
            }
        } catch (err) {
            if (err.message === "KYC not found") {
                setKyc(null);
            } else {
                setError(
                    err.message || "Unable to load KYC information."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: emptyForm,
        validationSchema,
        enableReinitialize: true,

        onSubmit: async (values) => {
            setSubmitting(true);
            setSuccess("");
            setError("");
            setModalError("");

            try {
                const formData = new FormData();

                formData.append("owner_name", values.owner_name.trim());
                formData.append(
                    "business_name",
                    values.business_name.trim()
                );
                formData.append(
                    "business_address",
                    values.business_address.trim()
                );
                formData.append(
                    "pan_number",
                    values.pan_number.trim().toUpperCase()
                );
                formData.append(
                    "gst_number",
                    values.gst_number.trim().toUpperCase()
                );
                formData.append(
                    "aadhaar_number",
                    values.aadhaar_number.trim()
                );

                [
                    "pan_document",
                    "aadhaar_document",
                    "gst_document"
                ].forEach((field) => {
                    if (values[field] instanceof File) {
                        formData.append(field, values[field]);
                    }
                });

                const response = await submitPartnerKyc(formData);

                await loadKyc();

                setEditModal(false);

                setSuccess(
                    response?.message ||
                        (hasKyc
                            ? "KYC updated successfully."
                            : "KYC submitted successfully.")
                );

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            } catch (err) {
                setModalError(
                    err?.message || "Unable to submit/update KYC."
                );
            } finally {
                setSubmitting(false);
            }
        }
    });

    useEffect(() => {
        loadKyc();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openEditModal = () => {
        if (isVerified) return;

        setSuccess("");
        setError("");
        setModalError("");
        setEditModal(true);
    };

    const closeEditModal = () => {
        if (submitting) return;

        setEditModal(false);
        setModalError("");
        formik.resetForm();

        if (kyc) {
            formik.setValues({
                owner_name: kyc.owner_name || "",
                business_name: kyc.business_name || "",
                business_address: kyc.business_address || "",
                pan_number: kyc.pan_number || "",
                gst_number: kyc.gst_number || "",
                aadhaar_number: kyc.aadhaar_number || "",
                pan_document: null,
                aadhaar_document: null,
                gst_document: null
            });
        }
    };

    if (loading) {
        return (
            <Layout
                title="Dashboard"
                activePath="/partner/kyc"
            >
                <div className="flex min-h-[55vh] items-center justify-center">
                    <div className="text-center">
                         <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-100 border-t-[#0F766E]" />
                        <p className="mt-3 text-xs font-medium text-slate-500">
                            Loading KYC information...
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout activePath="/partner/kyc">
            <div className="w-full">
              <div className="mx-auto w-full max-w-[1600px] space-y-4">
                    <div className="mb-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <span>Partners</span>
                                    <span>/</span>
                                    <span className="text-slate-600">
                                        KYC Verification
                                    </span>
                                </div>

                                <h3 className="text-[20px] font-extrabold tracking-tight text-[#092B31]">
                                    Partner KYC
                                </h3>

                                 <p className="mt-1 text-[11px] text-slate-500">
                                    Manage your KYC information and verification documents.
                                </p>
                            </div>

                            {kyc && (
                                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                                    <p className="text-xs text-slate-400">
                                        KYC ID
                                    </p>

                                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-800">
                                        #{kyc.kyc_id}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <AlertMessage
                        type="success"
                        message={success}
                    />

                    <AlertMessage
                        type="error"
                        message={error}
                    />

                    {!hasKyc && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                K
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-slate-900">
                                KYC not submitted
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                Please submit your KYC details and verification documents to complete your partner verification.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    formik.resetForm();
                                    setSuccess("");
                                    setError("");
                                    setModalError("");
                                    setEditModal(true);
                                }}
                                className="mt-5 rounded-xl bg-[#0F766E] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0E5957]"
                            >
                                Submit KYC
                            </button>
                        </div>
                    )}

                    {hasKyc && (
                        <>
                            <div className="mb-6">
                                <KycStatusCard
                                    status={kyc.kyc_status}
                                    rejectionReason={kyc.rejection_reason}
                                />
                            </div>

                            <KycDetails
                                kyc={kyc}
                                isVerified={isVerified}
                                onEdit={openEditModal}
                                setError={setError}
                            />
                        </>
                    )}
                </div>
            </div>

            {editModal && (
                <KycFormModal
                    kyc={kyc}
                    formik={formik}
                    submitting={submitting}
                    modalError={modalError}
                    onClose={closeEditModal}
                />
            )}
        </Layout>
    );
};

export default PartnerKyc;