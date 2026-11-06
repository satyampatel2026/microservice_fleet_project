import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { Pencil, Upload, Loader2, Save, UserRound, X } from "lucide-react";
import Layout from "../layouts/Layout";
import { getPartnerProfile, updatePartnerProfile, uploadPartnerPhoto } from "../services/partnerService";

const Toast = Swal.mixin({ toast: true, position: "top-end", timer: 2400, timerProgressBar: true, showConfirmButton: false, customClass: { popup: "!rounded-xl !border !border-slate-200 !shadow-lg", title: "!text-sm" } });

export default function PartnerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPartnerProfile().then((result) => {
      if (!cancelled) setProfile(result.data);
    }).catch((error) => { if (!cancelled) setError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retry]);

  // Selected photo ka local preview. Ye URL backend ko nahi bhejna.
  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => { setImageFailed(false); }, [preview, profile?.photo_url]);

  const formik = useFormik({
    initialValues: {
      partner_name: profile?.partner_name || "",
      mobile: profile?.mobile || "",
      personal_address: profile?.personal_address || "",
      gender: profile?.gender || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      partner_name: Yup.string().trim().min(3, "Enter at least 3 characters").max(100, "Maximum 100 characters").required("Name is required"),
      mobile: Yup.string().matches(/^[6-9][0-9]{9}$/, "Enter a valid 10 digit mobile number").required("Mobile is required"),
      personal_address: Yup.string().trim().max(1000, "Maximum 1000 characters"),
      gender: Yup.string().oneOf(["", "male", "female", "other"], "Select a valid gender"),
    }),
    onSubmit: async (values) => {
      try {
        const body = new FormData();
        body.append("partner_name", values.partner_name.trim());
        body.append("mobile", values.mobile);
        body.append("personal_address", values.personal_address.trim());
        body.append("gender", values.gender);
        const result = await updatePartnerProfile(body);
        setProfile(result.data);
        formik.resetForm({ values: {
          partner_name: result.data.partner_name,
          mobile: result.data.mobile,
          personal_address: result.data.personal_address || "",
          gender: result.data.gender || "",
        } });
        // Navbar mein nayi photo/name turant dikhao.
        window.dispatchEvent(new CustomEvent("partner-profile-updated", { detail: result.data }));
        Toast.fire({ icon: "success", title: "Profile updated successfully" });
      } catch (error) {
        Toast.fire({ icon: "error", title: error.message || "Unable to update profile" });
      }
    },
  });

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhoto(null); setPhotoError("Choose a JPEG or PNG photo"); return;
    }
    if (file.size > 50 * 1024) {
      setPhoto(null); setPhotoError("Photo must be 50 KB or smaller"); return;
    }
    setPhotoError("");
    setPhoto(file);
  }

  // Alag photo API: unsaved text fields isse save/reset nahi honge.
  async function handlePhotoUpload() {
    if (!photo || uploading || photoError) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("photo", photo);
      const result = await uploadPartnerPhoto(body);
      const updated = { ...profile, photo_url: result.data.photo_url };
      setProfile(updated);
      setPhoto(null);
      setPhotoError("");
      window.dispatchEvent(new CustomEvent("partner-profile-updated", { detail: updated }));
      Toast.fire({ icon: "success", title: "Image uploaded successfully" });
    } catch (error) {
      Toast.fire({ icon: "error", title: error.message || "Image upload failed" });
    } finally { setUploading(false); }
  }

  function resetChanges() {
    formik.resetForm();
  }

  const fieldClass = (name) => `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 disabled:bg-slate-50 ${formik.touched[name] && formik.errors[name] ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"}`;
  const fieldError = (name) => formik.touched[name] && formik.errors[name] ? <p id={`${name}-error`} role="alert" className="mt-1 text-[11px] text-red-600">{formik.errors[name]}</p> : null;
  const photoUrl = preview || profile?.photo_url;
  const changed = formik.dirty;

  return (
    <Layout activePath="/partner/profile">
      <div className="mx-auto w-full max-w-[820px]">


        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-xs text-slate-500"><Loader2 size={16} className="animate-spin" />Loading profile...</div>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-100 bg-white p-5 text-xs text-red-600">{error}<button type="button" onClick={() => setRetry(retry + 1)} className="ml-3 font-semibold underline">Retry</button></div>
        ) : profile && (
          <form onSubmit={formik.handleSubmit} noValidate className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_18px_rgba(7,27,34,0.035)] sm:p-4">
            <fieldset disabled={formik.isSubmitting || uploading} className="min-w-0">
              {/* Photo aur uska edit button. Select karne par hi upload button aayega. */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-teal-50 text-teal-700 sm:h-28 sm:w-28">
                    {photoUrl && !imageFailed ? <img src={photoUrl} onError={() => setImageFailed(true)} alt="Partner profile" className="h-full w-full object-cover" /> : <UserRound size={36} strokeWidth={1.5} />}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Edit profile photo" title="Select a new photo" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-teal-700 text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"><Pencil size={13} /></button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={choosePhoto} className="hidden" aria-label="Choose profile photo" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700">Profile photo</p>
                  <p className="mt-1 text-[11px] text-slate-400">Click the edit icon to select a photo.</p>
                  <p className="mt-1 text-[10px] text-slate-400">JPEG or PNG · Maximum 50 KB</p>
                  {photo && <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handlePhotoUpload} disabled={Boolean(photoError)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}{uploading ? "Uploading..." : "Upload Photo"}</button>
                    <button type="button" onClick={() => { setPhoto(null); setPhotoError(""); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"><X size={12} />Cancel</button>
                    <span className="max-w-[180px] truncate text-[10px] text-slate-400" title={photo.name}>{photo.name}</span>
                  </div>}
                  {photoError && <p role="alert" className="mt-2 text-[11px] text-red-600">{photoError}</p>}
                </div>
              </div>

              {/* Reference ki tarah compact two-column form. */}
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="partner_name" className="text-xs font-medium text-slate-600">Full Name <span className="text-red-500">*</span></label>
                  <input id="partner_name" autoComplete="name" maxLength={100} {...formik.getFieldProps("partner_name")} aria-invalid={Boolean(formik.touched.partner_name && formik.errors.partner_name)} aria-describedby="partner_name-error" className={fieldClass("partner_name")} />
                  {fieldError("partner_name")}
                </div>
                <div>
                  <label htmlFor="mobile" className="text-xs font-medium text-slate-600">Mobile Number <span className="text-red-500">*</span></label>
                  <input id="mobile" name="mobile" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} value={formik.values.mobile} onChange={(event) => formik.setFieldValue("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched.mobile && formik.errors.mobile)} aria-describedby="mobile-error" className={fieldClass("mobile")} />
                  {fieldError("mobile")}
                </div>
                <div>
                  <label htmlFor="profile-email" className="text-xs font-medium text-slate-600">Email</label>
                  <input id="profile-email" value={profile.email} readOnly className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 outline-none" />
                  <p className="mt-1 text-[10px] text-slate-400">Login email cannot be changed here.</p>
                </div>
                <fieldset className="min-w-0">
                  <legend className="text-xs font-medium text-slate-600">Gender</legend>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }].map((option) => (
                      <label key={option.value} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] transition ${formik.values.gender === option.value ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:border-teal-200"}`}>
                        <input type="radio" name="gender" value={option.value} checked={formik.values.gender === option.value} onChange={formik.handleChange} onBlur={formik.handleBlur} className="h-3 w-3 accent-teal-700" />{option.label}
                      </label>
                    ))}
                  </div>
                  {fieldError("gender")}
                </fieldset>
                <div className="sm:col-span-2">
                  <label htmlFor="personal_address" className="text-xs font-medium text-slate-600">Personal Address</label>
                  <textarea id="personal_address" autoComplete="street-address" rows={3} maxLength={1000} {...formik.getFieldProps("personal_address")} aria-invalid={Boolean(formik.touched.personal_address && formik.errors.personal_address)} aria-describedby="personal_address-error" className={`${fieldClass("personal_address")} resize-y`} placeholder="House, street, city and PIN code" />
                  {fieldError("personal_address")}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="submit" disabled={!changed} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40">{formik.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{formik.isSubmitting ? "Saving..." : "Save Changes"}</button>
                <button type="button" disabled={!changed} onClick={resetChanges} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Reset</button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </Layout>
  );
}
