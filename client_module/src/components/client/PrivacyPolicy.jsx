import { Link, useLocation} from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
 
    const location = useLocation();
    const fromDashboard =location.state?.from === "/client/dashboard";
    const backPath = fromDashboard ? "/client/dashboard" : "/";
  return (
    <main className="min-h-screen bg-[#090b12] px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          to={backPath}
         className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
        >
          <ArrowLeft size={16} />
          {fromDashboard ? "Back to Dashboard" : "Back to Home"}
        </Link>

        <article className="mt-6 rounded-2xl border border-white/10 bg-[#111521] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">
            Privacy Policy
          </h1>

          <div className="mt-6 space-y-5 text-sm leading-7 text-gray-300">
            <p>
              # Privacy Policy

**Effective date:** 25 October 2026 
**Business:**TNPLab Pvt Ltd, operating as FleetRova  
**Privacy contact:**s7515722@gmail.com

FleetRova provides a platform for clients to access garage and vehicle-related services. This policy explains how we collect, use and protect personal information when you use our website and services.

## 1. Information We Collect

Depending on the features you use, we may collect:

- **Account information:** Your name, email address and mobile number.
- **Login information:** A hashed version of your password. Our registration system does not store your password in plain text.
- **Account activity:** Account status, registration time and authentication-related records.
- **Consent records:** The Terms & Conditions you accepted, their version and the date and time of acceptance.
- **Support information:** Details you provide when contacting us.
- **Service information:** Booking, vehicle or service details you submit through available platform features.

Please provide only information needed to use the service. Do not send passwords or password-reset OTPs through support messages.

## 2. How We Use Information

We use personal information to:

- Create and manage your account.
- Authenticate login requests and protect account access.
- Send password-reset OTPs and account-related communications.
- Process service requests and coordinate with relevant garage partners.
- Respond to questions and support requests.
- Prevent misuse, investigate technical issues and maintain the platform.
- Maintain records of accepted terms and meet applicable legal obligations.

## 3. Cookies and Security Verification

FleetRova uses an authentication cookie to maintain your login session. Our login cookie is configured as HTTP-only, which prevents ordinary browser JavaScript from reading it.

We also use Cloudflare Turnstile for security verification. Turnstile may process browser, device and network information according to Cloudflare’s privacy practices.

This policy does not assume that blocking all cookies will leave every feature working. Disabling authentication cookies may prevent login and access to account features.

## 4. Sharing Information

We may share information with:

- **Relevant garage partners:** Information needed to handle a service request.
- **Service providers:** Providers supporting functions such as email delivery, security verification and platform operation.
- **Authorities or other parties:** Where disclosure is required by law or necessary to investigate fraud, protect safety or defend legal rights.

Some service providers may process information in countries other than your own.

## 5. Password Reset

Password-reset OTPs are sent to your registered email address. OTPs and temporary reset tokens have expiration limits, and verification attempts are restricted.

Keep your email account secure. FleetRova support will not need you to disclose your password or OTP.

## 6. Data Retention

We retain information for as long as reasonably needed to operate your account, provide services, resolve disputes, prevent misuse and meet applicable obligations.

Some records may remain after account closure where there is an ongoing operational or legal need. Deactivating an account does not necessarily delete its records.

## 7. Your Choices and Requests

You may contact [Privacy Email] to request access to, correction of or deletion of your personal information, or to raise a privacy concern.

We may need to verify your identity before acting on a request. Requests are handled subject to applicable law and any records we need to retain.

## 8. Information Security

We use measures such as password hashing, authenticated access and internal service checks to help protect information. No online service can guarantee complete security.

You are responsible for keeping your login credentials confidential and reporting suspected account misuse.

## 9. Changes to This Policy

We may update this policy as our services or data practices change. The current version and its effective date will be published on this page. Where required, we will provide additional notice or obtain consent.

## 10. Contact Us

For privacy questions or requests, contact:

**TNPLab Pvt Ltd — FleetRova**  
**Email:**s7515722@gmail.com
**Address:**F-318 Rajharsh Colony Kolar Road Bhopal (M.P.)-462042
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}