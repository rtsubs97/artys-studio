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
    "Brand Strategy & Identity",
    "Visual Design & Art Direction",
    "Packaging & Product Design",
    "Digital Experience & UI/UX",
    "Typography & Custom Type",
    "Motion Graphics & Animation"
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
            <p className="text-xl md:text-2xl leading-relaxed opacity-80 mb-6">
              Arty's Collective is a creative 3D Visualization Studio based out of India.
            </p>
            <p className="text-xl md:text-2xl leading-relaxed opacity-80 mb-6">
              We are a team of 9 creative minds, living, breathing, and dreaming creative solutions for brands and startups,
              by providing 3D visualization and animation solutions for social media campaigns, ad campaigns,
              cinematics for promos/sales pitch.
            </p>
            <p className="text-xl md:text-2xl leading-relaxed opacity-80">
              We work in Product, Architectural, Jewelry, & Automobile visualization and animation.
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
                    className="w-2 h-2 bg-[#ff6b00]"
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
                    className="w-2 h-2 bg-[#ff6b00]"
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

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          {[
            {
              title: "Global Reach",
              description: "Working with clients across continents, bringing international perspective to every project."
            },
            {
              title: "Award-Winning",
              description: "Recognition from leading design institutions and industry publications worldwide."
            },
            {
              title: "Proven Process",
              description: "A refined methodology that delivers exceptional results, on time and on budget."
            }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="border-l-2 border-[#ff6b00] pl-6"
            >
              <h4 className="text-2xl mb-4" style={{ fontWeight: 600 }}>{item.title}</h4>
              <p className="opacity-70 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
