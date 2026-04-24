import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function About() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const services = [
    "Modeling",
    "Texturing",
    "Lighting",
    "Animation",
    "Rendering",
    "Editing"
  ];

  const clients = [
    "Fortune 500 Companies",
    "Innovative Startups",
    "Cultural Institutions",
    "Global Fashion Brands",
    "Tech Leaders",
    "Retail Enterprises"
  ];

  return (
    <section id="about" ref={containerRef} className="relative py-32 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-[clamp(3rem,10vw,8rem)] leading-none tracking-tighter mb-8" style={{ fontWeight: 700 }}>
            ABOUT THE
            <br />
            STUDIO
          </h2>
          <motion.div style={{ y }} className="max-w-3xl">
            <p className="text-xl md:text-2xl leading-relaxed opacity-80">
              We provide creative solutions for brands and startups, by providing 3D visualization, 3D animation, and 3D Motin Graphics
              solutions for social media campaigns, ad campaigns, cinematics for promos/sales pitch.
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mt-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-4xl mb-8 pb-4 border-b border-white/20" style={{ fontWeight: 600 }}>
              What We Do
            </h3>
            <ul className="space-y-4">
              {services.map((service, index) => (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-lg flex items-center gap-4 group cursor-pointer"
                >
                  <motion.span
                    className="w-2 h-2 bg-[#a566ff]"
                    whileHover={{ scale: 1.5, rotate: 45 }}
                  />
                  <span className="group-hover:translate-x-2 transition-transform duration-300">
                    {service}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-4xl mb-8 pb-4 border-b border-white/20" style={{ fontWeight: 600 }}>
              Who We Work With
            </h3>
            <ul className="space-y-4">
              {clients.map((client, index) => (
                <motion.li
                  key={client}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-lg flex items-center gap-4 group cursor-pointer"
                >
                  <motion.span
                    className="w-2 h-2 bg-[#a566ff]"
                    whileHover={{ scale: 1.5, rotate: 45 }}
                  />
                  <span className="group-hover:translate-x-2 transition-transform duration-300">
                    {client}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
