
const AUTH_URL = "http://localhost:5000/api/partner";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong"
    );
  }

  return data;
}

// Register
export async function registerPartner(partnerData) {
  return request(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(partnerData),
  });
}

// Login
export async function loginPartner(loginData) {
  return request(`${AUTH_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });
}

// Logout
export async function logoutPartner() {
  return request(`${AUTH_URL}/logout`, {
    method: "POST",
  });
}

// Forgot Password - Send OTP
export async function sendForgotPasswordOtp(email,captchaToken) {
  return request(`${AUTH_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email,captchaToken }),
  });
}

// Forgot Password - Verify OTP
export async function verifyForgotPasswordOtp(email, otp) {
  return request(`${AUTH_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });
}

// Forgot Password - Reset Password
export async function resetForgotPassword(email, newPassword) {
  return request(`${AUTH_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, newPassword }),
  });
}

// Verify Partner Authentication
export async function verifyAuth() {
  return request(
    `${AUTH_URL}/auth/verify?t=${Date.now()}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );
}

// Public category and service catalog
export async function getPartnerServiceCatalog() {
  return request(
    "http://localhost:5000/api/partner/service-catalog",
    {
      method: "GET",
    }
  );
}

// ================= MY SERVICES =================

// Logged-in partner ki selected services
export async function getMyServices() {
  return request(
    "http://localhost:5000/api/partner/my-services",
    {
      method: "GET",
    }
  );
}

// Partner ki services add/remove/update
export async function updateMyServices(serviceIds) {
  return request(
    "http://localhost:5000/api/partner/my-services",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_ids: serviceIds,
      }),
    }
  );
}