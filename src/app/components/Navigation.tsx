import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Behance", href: "https://www.behance.net/rohantambe97", external: true },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6 md:px-8 md:py-6 flex justify-between items-center relative"
    >
      <motion.a
        href="#top"
        className="text-2xl tracking-tight"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        onClick={() => setIsMenuOpen(false)}
      >
        <span className="font-bold">ARTY</span>
        <span className="opacity-70"> STUDIOS</span>
      </motion.a>

      <button
        type="button"
        className="md:hidden p-2 border border-white/20 bg-black/30 backdrop-blur-sm"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-navigation-menu"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="hidden md:flex gap-12">
        {navItems.map((item, index) => (
          <motion.a
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="relative text-sm uppercase tracking-widest"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            onClick={() => setIsMenuOpen(false)}
            onMouseEnter={() => setHoveredItem(item.label)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {item.label}
            {hoveredItem === item.label && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.a>
        ))}
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-navigation-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-4 right-4 mt-3 border border-white/15 bg-black/95 backdrop-blur-md p-5 flex flex-col gap-4"
          >
            {navItems.map((item, index) => (
              <motion.a
                key={`mobile-${item.label}`}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-sm uppercase tracking-[0.25em] py-2 border-b border-white/10 last:border-b-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
