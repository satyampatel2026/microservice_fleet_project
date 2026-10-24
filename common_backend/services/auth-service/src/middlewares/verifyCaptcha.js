const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  if (!captchaToken || typeof captchaToken !== "string") {
    return res.status(400).json({
      success: false,
      message: "CAPTCHA verification required",
    });
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: captchaToken,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error("CAPTCHA service unavailable");
    }

    const result = await response.json();

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again.",
      });
    }

    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Security verification unavailable. Please retry.",
    });
  }
};

module.exports = verifyCaptcha;