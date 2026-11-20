import React from "react";
import { SITE } from "../config/site";

/** Floating chat button. Shows only when SITE.whatsapp is set in src/config/site.js */
const WhatsAppButton = () =>
  SITE.whatsapp ? (
    <a
      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi ${SITE.name}, I need some help.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 sm:bottom-6"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5z" />
        <path d="M9 9.5c0 3 2.5 5.500 5.500 5.500l1-1.500-2-1-.8.8c-.8-.4-1.600-1.200-2-2l.8-.8-1-2z" />
      </svg>
    </a>
  ) : null;

export default WhatsAppButton;