import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { Pencil, Upload, Loader2, Save, UserRound, X } from "lucide-react";
import { getClientProfile, updateClientProfile, uploadClientPhoto } from "../../services/clientService";
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2400,
  timerProgressBar: true,
  showConfirmButton: false,
  background: "#171b29",
  color: "#f3f4f6",
  customClass: {
    popup: "!rounded-xl !border !border-white/10 !shadow-lg",
    title: "!text-sm"
  }
});
export default function ClientProfile() {
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
    getClientProfile().then(result => {
      if (!cancelled) setProfile(result.data);
    }).catch(error => {
      if (!cancelled) setError(error.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  // Selected photo ka local preview. Ye URL backend ko nahi bhejna.
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    setImageFailed(false);
  }, [preview, profile?.photo_url]);
  const formik = useFormik({
    initialValues: {
      name: profile?.name || "",
      mobile: profile?.mobile || "",
      personal_address: profile?.personal_address || "",
      gender: profile?.gender || "",
      company_name: profile?.company_name || "",
      business_type: profile?.business_type || "",
      gstin: profile?.gstin || "",
      pan_number: profile?.pan_number || "",
      aadhaar_number: ""
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().trim().min(3, "Enter at least 3 characters").max(100, "Maximum 100 characters").required("Name is required"),
      mobile: Yup.string().matches(/^[6-9][0-9]{9}$/, "Enter a valid 10 digit mobile number").required("Mobile is required"),
      personal_address: Yup.string().trim().max(1000, "Maximum 1000 characters"),
      gender: Yup.string().oneOf(["", "male", "female", "other"], "Select a valid gender"),
      company_name: Yup.string().trim().min(2, "Minimum 2 characters").max(150, "Maximum 150 characters"),
      business_type: Yup.string().trim().max(60, "Maximum 60 characters"),
      gstin: Yup.string().trim().uppercase().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
        message: "Enter valid GSTIN",
        excludeEmptyString: true
      }),
      pan_number: Yup.string().trim().uppercase().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, {
        message: "Enter valid PAN",
        excludeEmptyString: true
      }),
      aadhaar_number: Yup.string().matches(/^[2-9][0-9]{11}$/, {
        message: "Enter valid 12 digit Aadhaar",
        excludeEmptyString: true
      })
    }),
    onSubmit: async values => {
      try {
        const body = new FormData();
        body.append("name", values.name.trim());
        body.append("mobile", values.mobile);
        body.append("personal_address", values.personal_address.trim());
        body.append("gender", values.gender);
        ["company_name", "business_type", "gstin", "pan_number", "aadhaar_number"].forEach(key => body.append(key, values[key].trim()));
        const result = await updateClientProfile(body);
        setProfile(result.data);
        formik.resetForm({
          values: {
            name: result.data.name,
            mobile: result.data.mobile,
            personal_address: result.data.personal_address || "",
            gender: result.data.gender || "",
            company_name: result.data.company_name || "",
            business_type: result.data.business_type || "",
            gstin: result.data.gstin || "",
            pan_number: result.data.pan_number || "",
            aadhaar_number: ""
          }
        });
        // Navbar mein nayi photo/name turant dikhao.
        window.dispatchEvent(new CustomEvent("client-profile-updated", {
          detail: result.data
        }));
        Toast.fire({
          icon: "success",
          title: "Profile updated successfully"
        });
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Unable to update profile"
        });
      }
    }
  });
  function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhoto(null);
      setPhotoError("Choose a JPEG or PNG photo");
      return;
    }
    if (file.size > 50 * 1024) {
      setPhoto(null);
      setPhotoError("Photo must be 50 KB or smaller");
      return;
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
      const result = await uploadClientPhoto(body);
      const updated = {
        ...profile,
        photo_url: result.data.photo_url
      };
      setProfile(updated);
      setPhoto(null);
      setPhotoError("");
      window.dispatchEvent(new CustomEvent("client-profile-updated", {
        detail: updated
      }));
      Toast.fire({
        icon: "success",
        title: "Image uploaded successfully"
      });
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: error.message || "Image upload failed"
      });
    } finally {
      setUploading(false);
    }
  }
  function resetChanges() {
    formik.resetForm();
  }
  const fieldClass = name => `mt-1.5 w-full rounded-lg border bg-[#121724] px-3 py-2.5 text-xs text-gray-200 outline-none focus:ring-2 disabled:bg-white/[0.03] ${formik.touched[name] && formik.errors[name] ? "border-red-300 focus:ring-red-100" : "border-white/10 focus:border-violet-400 focus:ring-violet-500/20"}`;
  const fieldError = name => formik.touched[name] && formik.errors[name] ? <p id={`${name}-error`} role="alert" className="mt-1 text-[11px] text-red-600">{formik.errors[name]}</p> : null;
  const photoUrl = preview || profile?.photo_url;
  const changed = formik.dirty;
  return <>
      <div className="mx-auto w-full max-w-[820px]">


        {loading ? <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121724] p-10 text-xs text-gray-400"><Loader2 size={16} className="animate-spin" />Loading profile...</div> : error ? <div role="alert" className="rounded-xl border border-red-100 bg-[#121724] p-5 text-xs text-red-600">{error}<button type="button" onClick={() => setRetry(retry + 1)} className="ml-3 font-semibold underline">Retry</button></div> : profile && <form onSubmit={formik.handleSubmit} noValidate className="rounded-xl border border-white/10 bg-[#121724] p-4 shadow-[0_3px_18px_rgba(7,27,34,0.035)] sm:p-4">
            <fieldset disabled={formik.isSubmitting || uploading} className="min-w-0">
              {/* Photo aur uska edit button. Select karne par hi upload button aayega. */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-violet-500/10 text-violet-300 sm:h-28 sm:w-28">
                    {photoUrl && !imageFailed ? <img src={photoUrl} onError={() => setImageFailed(true)} alt="Client profile" className="h-full w-full object-cover" /> : <UserRound size={36} strokeWidth={1.5} />}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Edit profile photo" title="Select a new photo" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#121724] bg-violet-700 text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-50"><Pencil size={13} /></button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={choosePhoto} className="hidden" aria-label="Choose profile photo" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-200">Profile photo</p>
                  {profile.business_verification_status === "verified" ? <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">✓ Verified Client</span> : <span className="mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">Business {profile.business_verification_status || "pending"}</span>}
                  <p className="mt-1 text-[11px] text-gray-500">Click the edit icon to select a photo.</p>
                  <p className="mt-1 text-[10px] text-gray-500">JPEG or PNG · Maximum 50 KB</p>
                  {photo && <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handlePhotoUpload} disabled={Boolean(photoError)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}{uploading ? "Uploading..." : "Upload Photo"}</button>
                    <button type="button" onClick={() => {
                  setPhoto(null);
                  setPhotoError("");
                }} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-gray-400 hover:bg-white/[0.03]"><X size={12} />Cancel</button>
                    <span className="max-w-[180px] truncate text-[10px] text-gray-500" title={photo.name}>{photo.name}</span>
                  </div>}
                  {photoError && <p role="alert" className="mt-2 text-[11px] text-red-600">{photoError}</p>}
                </div>
              </div>

              {/* Reference ki tarah compact two-column form. */}
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="text-xs font-medium text-gray-300">Full Name <span className="text-red-500">*</span></label>
                  <input id="name" autoComplete="name" maxLength={100} {...formik.getFieldProps("name")} aria-invalid={Boolean(formik.touched.name && formik.errors.name)} aria-describedby="name-error" className={fieldClass("name")} />
                  {fieldError("name")}
                </div>
                <div>
                  <label htmlFor="mobile" className="text-xs font-medium text-gray-300">Mobile Number <span className="text-red-500">*</span></label>
                  <input id="mobile" name="mobile" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} value={formik.values.mobile} onChange={event => formik.setFieldValue("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched.mobile && formik.errors.mobile)} aria-describedby="mobile-error" className={fieldClass("mobile")} />
                  {fieldError("mobile")}
                </div>
                <div>
                  <label htmlFor="profile-email" className="text-xs font-medium text-gray-300">Email</label>
                  <input id="profile-email" value={profile.email} readOnly className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-gray-400 outline-none" />
                  <p className="mt-1 text-[10px] text-gray-500">Login email cannot be changed here.</p>
                </div>
                <fieldset className="min-w-0">
                  <legend className="text-xs font-medium text-gray-300">Gender</legend>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[{
                  value: "male",
                  label: "Male"
                }, {
                  value: "female",
                  label: "Female"
                }, {
                  value: "other",
                  label: "Other"
                }].map(option => <label key={option.value} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] transition ${formik.values.gender === option.value ? "border-violet-400 bg-violet-500/10 text-violet-200" : "border-white/10 text-gray-300 hover:border-violet-300/40"}`}>
                        <input type="radio" name="gender" value={option.value} checked={formik.values.gender === option.value} onChange={formik.handleChange} onBlur={formik.handleBlur} className="h-3 w-3 accent-violet-500" />{option.label}
                      </label>)}
                  </div>
                  {fieldError("gender")}
                </fieldset>
                <div className="sm:col-span-2">
                  <label htmlFor="personal_address" className="text-xs font-medium text-gray-300">Personal Address</label>
                  <textarea id="personal_address" autoComplete="street-address" rows={3} maxLength={1000} {...formik.getFieldProps("personal_address")} aria-invalid={Boolean(formik.touched.personal_address && formik.errors.personal_address)} aria-describedby="personal_address-error" className={`${fieldClass("personal_address")} resize-y`} placeholder="House, street, city and PIN code" />
                  {fieldError("personal_address")}
                </div>
              </div>
              <section className="mt-5 border-t border-white/10 pt-4">
                <h2 className="text-sm font-semibold text-white">Company / Firm Details</h2>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">Provide company, business type, GSTIN or PAN, and Aadhaar for admin review. Editing these details requires fresh verification.</p>
                {profile.business_rejection_reason && <p role="alert" className="mt-2 text-xs text-red-300">Reason: {profile.business_rejection_reason}</p>}
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {[{
                name: "company_name",
                label: "Company / Firm Name",
                max: 150
              }, {
                name: "business_type",
                label: "Business Type",
                max: 60
              }, {
                name: "gstin",
                label: "GSTIN",
                max: 15
              }, {
                name: "pan_number",
                label: "PAN",
                max: 10
              }, {
                name: "aadhaar_number",
                label: "Aadhaar Number",
                max: 12
              }].map(field => <div key={field.name}>
                    <label htmlFor={field.name} className="text-xs font-medium text-gray-300">{field.label}</label>
                    <input id={field.name} maxLength={field.max} value={formik.values[field.name]} name={field.name} onBlur={formik.handleBlur} autoComplete="off" inputMode={field.name === "aadhaar_number" ? "numeric" : "text"} placeholder={field.name === "aadhaar_number" ? profile.aadhaar_masked ? `Saved: ${profile.aadhaar_masked}` : "12 digit Aadhaar" : field.name === "business_type" ? "e.g. Proprietorship / Private Limited" : ""} onChange={event => formik.setFieldValue(field.name, field.name === "aadhaar_number" ? event.target.value.replace(/\D/g, "") : ["gstin", "pan_number"].includes(field.name) ? event.target.value.toUpperCase() : event.target.value)} className={fieldClass(field.name)} />
                    {fieldError(field.name)}
                    {field.name === "aadhaar_number" && profile.aadhaar_masked && <p className="mt-1 text-[10px] text-slate-500">Leave empty to keep saved Aadhaar. Only last four digits are displayed.</p>}
                  </div>)}
                </div>
              </section>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="submit" disabled={!changed} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40">{formik.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{formik.isSubmitting ? "Saving..." : "Save Changes"}</button>
                <button type="button" disabled={!changed} onClick={resetChanges} className="rounded-lg border border-white/10 bg-[#121724] px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/[0.03] disabled:opacity-40">Reset</button>
              </div>
            </fieldset>
          </form>}
      </div>
    </>;
}
