interface Env {
  ALLOWED_ORIGIN?: string;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  RESEND_TO: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  website?: string;
  turnstileToken?: string;
  pageUrl?: string;
  userAgent?: string;
}

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

interface DeliveryResult {
  ok: boolean;
  status?: number;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCorsOrigin(request: Request, env: Env) {
  const requestOrigin = request.headers.get("Origin") || "*";
  const allowedOriginConfig = env.ALLOWED_ORIGIN?.trim();

  if (!allowedOriginConfig || allowedOriginConfig === "*") {
    return requestOrigin === "null" ? "*" : requestOrigin;
  }

  const allowedOrigins = allowedOriginConfig
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || "*";
}

function withCors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(origin: string, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...withCors(origin),
    },
  });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function verifyTurnstile(request: Request, env: Env, token: string) {
  const remoteIp = request.headers.get("CF-Connecting-IP") || "";
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: remoteIp,
  });

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json<TurnstileResponse>();
  return result.success;
}

async function sendWithResend(
  env: Env,
  payload: Required<Omit<ContactPayload, "website" | "turnstileToken">>,
): Promise<DeliveryResult> {
  const plainText = [
    "New website inquiry",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company: ${payload.company || "-"}`,
    "",
    "Message:",
    payload.message,
    "",
    "Meta:",
    `Page: ${payload.pageUrl || "-"}`,
    `User-Agent: ${payload.userAgent || "-"}`,
    `Received At: ${new Date().toISOString()}`,
  ].join("\n");

  const htmlBody = `
    <h2>New website inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Company:</strong> ${escapeHtml(payload.company || "-")}</p>
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(payload.message)}</pre>
    <hr />
    <p><strong>Page:</strong> ${escapeHtml(payload.pageUrl || "-")}</p>
    <p><strong>User-Agent:</strong> ${escapeHtml(payload.userAgent || "-")}</p>
    <p><strong>Received At:</strong> ${new Date().toISOString()}</p>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [env.RESEND_TO],
      reply_to: payload.email,
      subject: `New inquiry from ${payload.name}`,
      text: plainText,
      html: htmlBody,
    }),
  });

  if (resendResponse.ok) {
    return { ok: true };
  }

  let message = "Failed to deliver inquiry email.";
  try {
    const errorPayload = await resendResponse.json() as {
      message?: string;
      error?: { message?: string };
    };
    message = errorPayload.error?.message || errorPayload.message || message;
  } catch {
    // Keep fallback message when provider payload can't be parsed.
  }

  return {
    ok: false,
    status: resendResponse.status,
    error: message,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = getCorsOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: withCors(origin),
      });
    }

    if (request.method !== "POST") {
      return json(origin, 405, { error: "Method not allowed." });
    }

    if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.RESEND_FROM || !env.RESEND_TO) {
      return json(origin, 500, { error: "Server is missing required configuration." });
    }

    let data: ContactPayload;
    try {
      data = (await request.json()) as ContactPayload;
    } catch {
      return json(origin, 400, { error: "Invalid JSON body." });
    }

    if (clean(data.website)) {
      return json(origin, 200, { ok: true, message: "Thanks, your message has been sent." });
    }

    const name = clean(data.name);
    const email = clean(data.email);
    const company = clean(data.company);
    const message = clean(data.message);
    const pageUrl = clean(data.pageUrl);
    const userAgent = clean(data.userAgent);
    const turnstileToken = clean(data.turnstileToken);

    if (name.length < 2 || name.length > 90) {
      return json(origin, 400, { error: "Please enter a valid name." });
    }
    if (!EMAIL_REGEX.test(email) || email.length > 190) {
      return json(origin, 400, { error: "Please enter a valid email address." });
    }
    if (company.length > 160) {
      return json(origin, 400, { error: "Company name is too long." });
    }
    if (message.length < 10 || message.length > 5000) {
      return json(origin, 400, { error: "Please provide project details between 10 and 5000 characters." });
    }
    if (!turnstileToken) {
      return json(origin, 400, { error: "Captcha verification is required." });
    }

    const captchaValid = await verifyTurnstile(request, env, turnstileToken);
    if (!captchaValid) {
      return json(origin, 400, { error: "Captcha verification failed. Please try again." });
    }

    const delivery = await sendWithResend(env, {
      name,
      email,
      company,
      message,
      pageUrl,
      userAgent,
    });

    if (!delivery.ok) {
      console.error("Resend delivery failed", {
        status: delivery.status,
        error: delivery.error,
      });
      return json(origin, 502, { error: "We could not send your message right now. Please try again shortly." });
    }

    return json(origin, 200, { ok: true, message: "Thanks, your message has been sent." });
  },
};
