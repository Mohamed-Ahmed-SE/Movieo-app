        import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Facebook, Twitter, Instagram, Youtube, Linkedin, Github,
  Mail, Phone, MapPin, ArrowRight, Heart, Star, Award,
  Shield, Users, Globe, Download, Play, Bookmark, Search
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();
  const footerSections = [
    {
      title: "Movies & TV Shows",
      links: [
        { name: "Trending", href: "/explore/movie/trending" },
        { name: "Top Rated", href: "/explore/movie/top-rated" },
        { name: "Upcoming", href: "/explore/movie/upcoming" },
        { name: "Now Playing", href: "/explore/movie/now-playing" },
        { name: "Popular TV", href: "/explore/tv/popular" },
        { name: "On Air TV", href: "/explore/tv/on-air" }
      ]
    },
    {
      title: "Categories",
      links: [
        { name: "Action", href: "/explore/movie/action" },
        { name: "Comedy", href: "/explore/movie/comedy" },
        { name: "Drama", href: "/explore/movie/drama" },
        { name: "Horror", href: "/explore/movie/horror" },
        { name: "Romance", href: "/explore/movie/romance" },
        { name: "Sci-Fi", href: "/explore/movie/sci-fi" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "/contact" },
        { name: "FAQ", href: "/faq" },
        { name: "Account", href: "/account" },
        { name: "Media Center", href: "/media" },
        { name: "Investor Relations", href: "/investors" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Use", href: "/terms" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" },
        { name: "Accessibility", href: "/accessibility" },
        { name: "Corporate Information", href: "/corporate" }
      ]
    }
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "#", color: "hover:text-blue-500" },
    { name: "Twitter", icon: Twitter, href: "#", color: "hover:text-blue-400" },
    { name: "Instagram", icon: Instagram, href: "#", color: "hover:text-pink-500" },
    { name: "YouTube", icon: Youtube, href: "#", color: "hover:text-red-500" },
    { name: "LinkedIn", icon: Linkedin, href: "#", color: "hover:text-blue-600" },
    { name: "GitHub", icon: Github, href: "#", color: "hover:text-gray-400" }
  ];

  const quickStats = [
    { icon: Users, label: "Active Users", value: "5M+" },
    { icon: Play, label: "Hours Watched", value: "25M+" },
    { icon: Bookmark, label: "Watchlists", value: "2M+" },
    { icon: Star, label: "Average Rating", value: "4.8" }
  ];

  return (
    <motion.footer 
      className={`text-white transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-black to-gray-900'
          : 'bg-gradient-to-b from-gray-100 to-gray-200'
      }`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Top Section with Logo and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Logo and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-4">
                Movieo
              </h2>
              <p className={`text-lg leading-relaxed ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Your ultimate destination for discovering and streaming the best movies and TV shows from around the world.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-red-500" />
                      <div>
                        <div className={`font-bold text-lg ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{stat.value}</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>{stat.label}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {footerSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className={`font-bold text-lg mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <motion.li
                        key={link.name}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          to={link.href}
                          className={`transition-colors text-sm flex items-center gap-2 group ${
                            isDarkMode 
                              ? 'text-white/60 hover:text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.name}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-2xl p-8 border border-white/10 mb-12"
        >
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Stay Updated
            </h3>
            <p className={`mb-6 max-w-2xl mx-auto ${
              isDarkMode ? 'text-white/70' : 'text-gray-600'
            }`}>
              Get the latest updates on new releases, exclusive content, and special offers delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className={`flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Social Links and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            viewport={{ once: true }}
          >
            <h4 className={`font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>Follow Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } ${social.color}`}
                    title={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            viewport={{ once: true }}
          >
            <h4 className={`font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Contact Info</h4>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <Mail className={`w-4 h-4 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`} />
                <span>support@movieo.com</span>
              </div>
              <div className={`flex items-center gap-3 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <Phone className={`w-4 h-4 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className={`flex items-center gap-3 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <MapPin className={`w-4 h-4 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`} />
                <span>123 Movie Street, Hollywood, CA 90210</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              viewport={{ once: true }}
              className={`text-sm text-center md:text-left ${
                isDarkMode ? 'text-white/60' : 'text-gray-600'
              }`}
            >
              <p>&copy; {new Date().getFullYear()} Movieo, Inc. All Rights Reserved.</p>
              <p className="mt-1">
                Made with <Heart className="w-4 h-4 inline text-red-500" /> by Dynamic Coding with Amit
              </p>
            </motion.div>

            {/* Additional Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              viewport={{ once: true }}
              className="flex items-center gap-6 text-sm"
            >
              <Link to="/terms" className={`transition-colors ${
                isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Terms of Service
              </Link>
              <Link to="/privacy" className={`transition-colors ${
                isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Privacy Policy
              </Link>
              <Link to="/cookies" className={`transition-colors ${
                isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Cookie Policy
              </Link>
              <div className={`flex items-center gap-2 ${
                isDarkMode ? 'text-white/60' : 'text-gray-600'
              }`}>
                <Shield className={`w-4 h-4 ${
                  isDarkMode ? 'text-white/60' : 'text-gray-600'
                }`} />
                <span>Secure</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;