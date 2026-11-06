import Swal from "sweetalert2";

// API success/error messages ke liye same styled toast.
export function showToast(icon, message) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    titleText: message,
    background: "#171b29",
    color: "#e2e8f0",
    showConfirmButton: false,
    showCloseButton: true,
    timer: icon === "error" ? 5500 : 3500,
    timerProgressBar: true,
    returnFocus: false,
    customClass: { popup: "client-auth-toast" },
    didOpen: (element) => {
      element.addEventListener("mouseenter", Swal.stopTimer);
      element.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

// Har field ka rule yahan hai; pages mein sirf function call hoga.
export function validateField(field, value, password = "") {
  if (field === "name") {
    if (!value.trim()) return "Please enter your full name.";
    if ((value.trim().match(/\p{L}/gu) || []).length < 3) return "Name must contain at least 3 letters.";
    if (value.trim().length > 100) return "Name cannot exceed 100 characters.";
    if (!/^[\p{L}\p{M} .'’-]+$/u.test(value.trim())) return "Use letters, spaces, dots, apostrophes or hyphens only.";
  }
  if (field === "email") {
    if (!value.trim()) return "Please enter your email address.";
    if (value.trim().length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email, for example name@example.com.";
  }
  if (field === "mobile") {
    if (!value) return "Please enter your mobile number.";
    if (!/^[6-9][0-9]{9}$/.test(value)) return "Enter 10 digits starting with 6, 7, 8 or 9.";
  }
  if (field === "loginPassword" && !value) return "Please enter your password.";
  if (field === "password" || field === "newPassword") {
    if (!value) return "Please enter a password.";
    if (value.length < 8) return "Use at least 8 characters.";
    if (new TextEncoder().encode(value).length > 72) return "Password is too long (maximum 72 UTF-8 bytes).";
  }
  if (field === "confirmPassword") {
    if (!value) return "Please confirm your password.";
    if (value !== password) return "Passwords do not match.";
  }
  if (field === "otp") {
    if (!/^[0-9]{6}$/.test(value)) return "Enter the 6-digit OTP from your email.";
  }
  return "";
}

// Submit par pehle invalid field tak keyboard focus le jao.
export function focusFirstError(errors) {
  const firstField = Object.keys(errors).find((field) => errors[field]);
  if (firstField) document.getElementById(firstField)?.focus();
  return Boolean(firstField);
}
