import React from 'react';
import { COLOR_CLASSES } from '../../constants/colors';

/**
 * Footer Component - Site footer
 * 
 * Features:
 * - Copyright information
 * - Legal links
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
    <footer className={`${COLOR_CLASSES.surface.footer} ${COLOR_CLASSES.border.primary} border-t`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className={`text-sm ${COLOR_CLASSES.text.primary}`}>
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
                className={`text-sm ${COLOR_CLASSES.text.primary} hover:${COLOR_CLASSES.text.link} transition-colors duration-200`}
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