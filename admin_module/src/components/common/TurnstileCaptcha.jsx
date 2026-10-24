import { forwardRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const TurnstileCaptcha = forwardRef(({ onVerify }, ref) => (
  <Turnstile
    ref={ref}
    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
    options={{
      theme: "light",
      size: "normal",
    }}
    onSuccess={(token) => onVerify(token)}
    onExpire={() => onVerify("")}
    onError={() => onVerify("")}
  />
));

export default TurnstileCaptcha;