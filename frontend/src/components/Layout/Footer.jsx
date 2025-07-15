import React from 'react';

/**
 * Footer Component - Site footer
 *
 * Features:
 * - Copyright information
 * - Legal links
 * - Darker gray styling for clear distinction
 * - Responsive layout
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Privacy Policy', href: '#', isExternal: false },
    { label: 'Terms of Service', href: '#', isExternal: false },
    { label: 'Contact', href: '#', isExternal: false },
  ];

  return (
    <footer className="border-t border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900/95">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            © {currentYear} Project Planner. All rights reserved.
          </div>

          {/* Footer Links */}
          <div className="flex items-center space-x-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
