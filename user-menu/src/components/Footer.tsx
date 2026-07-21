import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, ChevronUp } from "lucide-react";
import { motion } from "motion/react";

export default function Footer({ onAdminClick }: { onAdminClick?: () => void }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-900 pt-16 pb-8 px-6 relative overflow-hidden" id="restaurant-footer">
      {/* Decorative Gradient Line top border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          
          {/* Column 1: Brand & Description */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              WEBRAJYA <span className="text-[#d4af37]">QR MENU</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-sans font-light max-w-md">
              WebRajya POS QR Menu is a premium, seamless digital dining and ordering solution. Enhance your restaurant's order accuracy, speed, and customer satisfaction with our state-of-the-art interactive POS QR menus.
            </p>
            
            {/* Social Grid */}
            <div className="flex items-center gap-3.5 pt-3">
              <a
                href="https://facebook.com"
                aria-label="Facebook Profile"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-[#d4af37] border border-stone-850 hover:border-transparent flex items-center justify-center text-stone-450 hover:text-black transition-all cursor-pointer"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/idli.junction"
                aria-label="Instagram Profile"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-[#d4af37] border border-stone-850 hover:border-transparent flex items-center justify-center text-stone-450 hover:text-black transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter Profile"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-[#d4af37] border border-stone-850 hover:border-transparent flex items-center justify-center text-stone-450 hover:text-black transition-all cursor-pointer"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Information, Hours & Contacts */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase text-[#d4af37]">
              CONTACT DETAILS
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm font-sans">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <span className="text-stone-400 font-light leading-snug">
                  WebRajya POS Solutions, Mankapur Ring Road, Nagpur 440022
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <a href="tel:+919209521933" className="text-stone-400 hover:text-white transition-colors font-light">
                  +91 92095 21933
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <a href="mailto:contact@webrajya.com" className="text-stone-400 hover:text-white transition-colors font-light truncate">
                  contact@webrajya.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <div className="text-stone-400 font-light">
                  <span className="block font-medium text-white mb-0.5">BUSINESS HOURS</span>
                  <span className="block text-[11px] leading-relaxed">
                    Mon - Thu: 7:00 AM - 10:30 PM<br/>
                    Fri - Sat: 7:00 AM - 10:00 PM<br/>
                    Sun: 7:00 AM - 10:30 PM
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Google Map Location Integration & Delivery */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase text-[#d4af37]">
              OUR PORTAL & LOCATION
            </h3>
            
            <div className="flex gap-2.5">
              <a
                href="https://webrajya.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/25 border border-[#d4af37]/30 text-[#d4af37] hover:text-white hover:border-transparent font-semibold rounded-lg text-[11px] text-center transition-all focus:outline-none"
              >
                WebRajya POS
              </a>
              <a
                href="mailto:contact@webrajya.com"
                className="flex-1 py-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/25 border border-[#d4af37]/30 text-[#d4af37] hover:text-white hover:border-transparent font-semibold rounded-lg text-[11px] text-center transition-all focus:outline-none"
              >
                Request Sales Demo
              </a>
            </div>
            
            {/* Embedded maps iframe representation */}
            <div className="w-full h-44 rounded-xl overflow-hidden border border-stone-850 bg-stone-900 flex items-center justify-center relative shadow-md">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.0772718136367!2d77.1082!3d28.6322!2m3!1f0!2f0!3f0!3m2!1i1248!2i786!4m2!3m1!1s0x0%3A0x0!2zMjgmdW5pcXVl!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                title="WebRajya Solutions Location Map"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale opacity-40 focus:outline-none"
              ></iframe>
              <div className="absolute top-2 right-2 bg-stone-950/90 backdrop-blur-md px-2 py-1 rounded border border-stone-800 text-[9px] font-mono font-bold tracking-widest uppercase text-[#d4af37]">
                NAGPUR HEADQUARTERS
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits strip & Back to top button */}
        <div className="pt-8 border-t border-stone-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-sans tracking-wide">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>
              &copy; {new Date().getFullYear()} WebRajya POS Solutions. All Rights Reserved. &ldquo;Smart Solutions for Modern Dining.&rdquo;
            </span>
            {onAdminClick && (
              <span className="inline-flex items-center gap-1.5 ml-2">
                <span className="text-stone-800">|</span>
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="px-2 py-0.5 bg-[#d4af37]/10 hover:bg-[#d4af37] border border-[#d4af37]/20 hover:border-transparent text-[10px] text-[#d4af37] hover:text-black font-semibold rounded transition-all cursor-pointer focus:outline-none"
                  id="footer-admin-login-link"
                >
                  🔐 Admin Login
                </button>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="font-light text-[10px] text-stone-400 bg-stone-900/40 px-2.5 py-1 rounded border border-stone-850 leading-none">
              PURE VEGETARIAN DINING
            </div>
            
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="px-3 py-2 bg-stone-900 hover:bg-[#d4af37] border border-stone-850 hover:border-transparent text-stone-450 hover:text-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
              title="Return to top"
              id="back-to-top-btn"
            >
              Back to Top
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
