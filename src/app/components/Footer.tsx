import { Linkedin, Twitter, Instagram, Dribbble } from "lucide-react";

export function Footer() {
  const quickLinks = [
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Contact", href: "#contact" },
  ];

  const socialLinks = [
    { label: "Behance", href: "https://www.behance.net/rohantambe97", icon: Dribbble },
    { label: "LinkedIn", href: null, icon: Linkedin },
    { label: "Instagram", href: null, icon: Instagram },
    { label: "Twitter", href: null, icon: Twitter },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Arty Studios
            </h3>
            <p className="text-gray-400">
              Creating exceptional design solutions for brands worldwide since 2020.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                if (!social.href) {
                  return (
                    <span
                      key={social.label}
                      className="w-10 h-10 bg-gray-800/60 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed"
                      aria-label={`${social.label} link unavailable`}
                      aria-disabled="true"
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                  );
                }

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Arty Studios. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
