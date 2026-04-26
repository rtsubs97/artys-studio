import { motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    let cancelled = false;

    const mountTurnstile = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile) {
        return;
      }

      turnstileContainerRef.current.innerHTML = "";
      const nextWidgetId = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        action: "contact_form",
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        "expired-callback": () => {
          setTurnstileToken("");
        },
        "error-callback": () => {
          setTurnstileToken("");
        },
      });

      setWidgetId(nextWidgetId);
    };

    if (window.turnstile) {
      mountTurnstile();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", mountTurnstile);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", mountTurnstile);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [widgetId]);

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (widgetId && window.turnstile?.reset) {
      window.turnstile.reset(widgetId);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!CONTACT_ENDPOINT) {
      setSubmitState("error");
      setSubmitMessage("Contact endpoint not configured yet.");
      return;
    }

    if (!TURNSTILE_SITE_KEY) {
      setSubmitState("error");
      setSubmitMessage("Captcha is not configured yet.");
      return;
    }

    if (!turnstileToken) {
      setSubmitState("error");
      setSubmitMessage("Please complete the captcha verification.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("Sending your message...");

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          website: honeypot,
          turnstileToken,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;

      if (!response.ok) {
        setSubmitState("error");
        setSubmitMessage(payload?.error || "Could not send your message right now. Please try again.");
        resetTurnstile();
        return;
      }

      setSubmitState("success");
      setSubmitMessage(payload?.message || "Thanks, your message has been sent.");
      setFormData({
        name: "",
        email: "",
        company: "",
        message: "",
      });
      setHoneypot("");
      resetTurnstile();
    } catch {
      setSubmitState("error");
      setSubmitMessage("Network issue while sending. Please try again.");
      resetTurnstile();
    }
  };

  const socials = [
    { name: "Behance", url: "https://www.behance.net/artystudio3d" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/roantambe/" },
    { name: "Instagram", url: "https://www.instagram.com/artys_3d_studio" },
    // { name: "Twitter", url: null }
  ];

  return (
    <section id="contact" className="relative py-32 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-[clamp(3rem,10vw,8rem)] leading-none tracking-tighter" style={{ fontWeight: 700 }}>
            LET'S CREATE
            <br />
            TOGETHER
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12">
              <h3 className="text-3xl mb-6" style={{ fontWeight: 600 }}>Start a Project</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <label htmlFor="contact-name" className="sr-only">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-white/20 py-4 px-0 focus:border-[#a566ff] outline-none transition-colors text-lg"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="contact-email" className="sr-only">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-white/20 py-4 px-0 focus:border-[#a566ff] outline-none transition-colors text-lg"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="contact-company" className="sr-only">
                  Company or Organization
                </label>
                <input
                  id="contact-company"
                  name="company"
                  type="text"
                  placeholder="Company / Organization"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-white/20 py-4 px-0 focus:border-[#a566ff] outline-none transition-colors text-lg"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="contact-message" className="sr-only">
                  Tell us about your project
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Tell us about your project"
                  autoComplete="off"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full bg-transparent border-b-2 border-white/20 py-4 px-0 focus:border-[#a566ff] outline-none transition-colors text-lg resize-none"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="pt-2"
              >
                {TURNSTILE_SITE_KEY ? (
                  <div>
                    <div ref={turnstileContainerRef} />
                    <p className="mt-2 text-xs text-white/60">
                      Cloudflare Turnstile may verify instantly for trusted users. Challenge prompts appear only when risk is detected.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-300/90">Captcha setup missing. Add `VITE_TURNSTILE_SITE_KEY`.</p>
                )}
              </motion.div>

              <motion.button
                type="submit"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={
                  submitState === "submitting" || !turnstileToken || !CONTACT_ENDPOINT || !TURNSTILE_SITE_KEY
                }
                className="px-16 py-6 border border-white/80 bg-white text-black uppercase tracking-widest text-lg mt-8 transition-colors duration-300 hover:bg-[#d5bcff] hover:border-[#d5bcff] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitState === "submitting" ? "Sending..." : "Send Message"}
              </motion.button>

              {submitMessage && (
                <p
                  className={`text-sm ${
                    submitState === "error" ? "text-red-300/90" : submitState === "success" ? "text-green-300/90" : "text-white/70"
                  }`}
                  role="status"
                >
                  {submitMessage}
                </p>
              )}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:pl-20"
          >
            <div className="mb-16">
              <h3 className="text-3xl mb-6" style={{ fontWeight: 600 }}>Contact Info</h3>
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-sm uppercase tracking-wider opacity-60 mb-2">Email</div>
                  <a href="mailto:rohan@artys-studio.com" className="text-xl hover:text-[#a566ff] transition-colors">
                    rohan@artys-studio.com
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  {/* <div className="text-sm uppercase tracking-wider opacity-60 mb-2">Location</div>
                  <p className="text-xl">Mumbai, India</p>
                  <p className="text-xl opacity-70">Working Globally</p> */}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-sm uppercase tracking-wider opacity-60 mb-2">Response Time</div>
                  <p className="text-xl">Within 6 hours</p>
                </motion.div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl mb-6" style={{ fontWeight: 600 }}>Follow Us</h3>
              <div className="space-y-4">
                {socials.map((social, index) => {
                  const socialUrl = social.url ?? undefined;
                  const isAvailable = Boolean(socialUrl);

                  if (!isAvailable) {
                    return (
                      <motion.div
                        key={social.name}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * index }}
                        className="block text-2xl relative opacity-40 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        {social.name}
                      </motion.div>
                    );
                  }

                  return (
                    <motion.a
                      key={social.name}
                      href={socialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index }}
                      className="block text-2xl relative group"
                      onMouseEnter={() => setHoveredSocial(social.name)}
                      onMouseLeave={() => setHoveredSocial(null)}
                    >
                      {social.name}
                      {hoveredSocial === social.name && (
                        <motion.div
                          layoutId="social-underline"
                          className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#a566ff]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.a>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-32 pt-16 border-t border-white/20 text-center"
        >
          <p className="text-sm uppercase tracking-widest opacity-60">
            © 2026 Art'y Studio. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

