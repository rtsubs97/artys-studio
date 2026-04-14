import { motion } from "motion/react";
import { Palette, MonitorSmartphone, Package, Video, Megaphone, Layout } from "lucide-react";

export function Services() {
  const services = [
    {
      icon: Palette,
      title: "Brand Identity",
      description: "Complete brand strategy, logo design, and visual identity systems that make your brand unforgettable.",
    },
    {
      icon: MonitorSmartphone,
      title: "UI/UX Design",
      description: "User-centered digital experiences that are intuitive, beautiful, and conversion-focused.",
    },
    {
      icon: Layout,
      title: "Web Design",
      description: "Responsive, modern websites that engage visitors and drive business results.",
    },
    {
      icon: Package,
      title: "Packaging Design",
      description: "Eye-catching packaging that stands out on shelves and resonates with your target audience.",
    },
    {
      icon: Video,
      title: "Motion Graphics",
      description: "Dynamic animations and video content that bring your brand story to life.",
    },
    {
      icon: Megaphone,
      title: "Marketing Materials",
      description: "Comprehensive collateral design from brochures to social media content.",
    },
  ];

  return (
    <section id="services" className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6 text-gray-900">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive creative solutions tailored to elevate your brand and achieve your business objectives
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
