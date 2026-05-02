"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "kritaman.royalScroll.shown";

// Palette tones — kept inline so this component is self-contained.
const PINE = "#3E4A45";
const PINE_SOFT = "#647a63";
const SAND = "#C9B59A";
const SAND_DEEP = "#8a7758";
const LINEN = "#EEE6DA";

export default function RoyalScrollBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    const timer = setTimeout(() => setOpen(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-3 py-6 sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="royal-scroll-title"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(35, 43, 39, 0.72), rgba(15, 19, 17, 0.92))",
        animation: "scrollBackdropFade 600ms ease-out forwards",
      }}
    >
      {/* Close button — sand-rimmed on a hushed pine surface */}
      <button
        type="button"
        onClick={close}
        aria-label="Close proclamation"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-105 sm:right-6 sm:top-6"
        style={{
          borderColor: `${SAND}99`,
          backgroundColor: "rgba(22, 27, 24, 0.55)",
          color: LINEN,
        }}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Scroll body */}
      <div
        className="relative w-full max-w-2xl"
        style={{
          animation: "scrollUnfurl 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          transformOrigin: "center",
        }}
      >
        {/* Top dowel — deep pine wood */}
        <div className="relative z-10 mx-auto -mb-2 h-5 w-[calc(100%+24px)] -translate-x-3 rounded-full royal-dowel">
          <div className="absolute -left-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full royal-dowel-cap" />
          <div className="absolute -right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full royal-dowel-cap" />
        </div>

        {/* Parchment */}
        <div className="relative overflow-hidden royal-parchment">
          {/* Inner sand frames */}
          <div
            className="pointer-events-none absolute inset-2 border"
            style={{ borderColor: `${SAND_DEEP}55` }}
          />
          <div
            className="pointer-events-none absolute inset-3 border"
            style={{ borderColor: `${SAND_DEEP}33` }}
          />

          {/* Corner ornaments */}
          <CornerOrnament className="absolute left-2 top-2" />
          <CornerOrnament className="absolute right-2 top-2 rotate-90" />
          <CornerOrnament className="absolute left-2 bottom-2 -rotate-90" />
          <CornerOrnament className="absolute right-2 bottom-2 rotate-180" />

          <div
            className="relative px-6 py-8 sm:px-12 sm:py-10 max-h-[78vh] overflow-y-auto custom-scrollbar"
            style={{
              animation: "scrollContentReveal 1500ms ease-out forwards",
              opacity: 0,
            }}
          >
            {/* Sanskrit / Sanātana opening */}
            <p
              className="text-center font-display text-[11px] tracking-[0.4em] uppercase"
              style={{
                color: PINE_SOFT,
                animation: "goldShimmer 3.4s ease-in-out infinite",
              }}
            >
              ॥ ॐ नमो भगवते वासुदेवाय ॥
            </p>

            {/* Founder portrait */}
            <div className="mt-6 flex justify-center">
              <div className="relative">
                <div
                  className="absolute -inset-1.5 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, ${SAND}, ${LINEN}, ${SAND_DEEP}, ${LINEN}, ${SAND})`,
                  }}
                />
                <div
                  className="relative h-32 w-32 overflow-hidden rounded-full ring-4 sm:h-36 sm:w-36"
                  style={{ boxShadow: `0 0 0 4px ${LINEN}cc` }}
                >
                  <Image
                    src="/srila-prabhupada.jpg"
                    alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada"
                    fill
                    sizes="160px"
                    className="object-cover"
                    style={{ filter: "saturate(1.02) contrast(1.04)" }}
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title block */}
            <div className="mt-7 text-center">
              <p
                className="text-[10px] tracking-[0.32em] uppercase"
                style={{ color: `${PINE}99` }}
              >
                Hare Kṛṣṇa
              </p>
              <h1
                id="royal-scroll-title"
                className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl"
                style={{ color: PINE, letterSpacing: "0.01em" }}
              >
                ISKCON
              </h1>
              <p
                className="mt-1.5 font-display text-[15px] italic sm:text-base"
                style={{ color: PINE_SOFT }}
              >
                Founded by His Divine Grace
                <br className="sm:hidden" />
                <span className="font-semibold not-italic" style={{ color: PINE }}>
                  {" "}A.C. Bhaktivedanta Swami Prabhupada
                </span>
              </p>
            </div>

            <Divider />

            {/* Body */}
            <div
              className="space-y-4 font-display text-[15px] leading-7 sm:text-[17px] sm:leading-[1.85]"
              style={{ color: PINE }}
            >
              <p
                className="text-center text-[13px] italic"
                style={{ color: `${PINE_SOFT}cc` }}
              >
                Please accept our humble obeisances. All glories to Śrīla
                Prabhupāda. All glories to Śrī Śrī Guru and Gaurāṅga.
              </p>
              <p className="first-letter:font-semibold first-letter:text-3xl first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1 [&::first-letter]:text-[color:var(--color-pine)]">
                By the causeless mercy of Śrīla Prabhupāda and the blessings of
                the Vaiṣṇavas, this platform has been offered as a small
                spiritual initiative — a humble attempt to share Kṛṣṇa
                consciousness through lectures, kīrtana, and the timeless
                teachings preserved in our paramparā.
              </p>
              <p>
                We are deeply grateful to every devotee, well-wisher, and
                seeker who uses this seva.
              </p>
              <p>
                This is a living seva and we will continue to refine it based
                on your feedback. Please write to us with any suggestion,
                request, or correction — your guidance helps us serve this
                mission better.
              </p>
              <p
                className="text-center text-[13px] tracking-[0.18em] uppercase"
                style={{ color: `${PINE_SOFT}cc` }}
              >
                — Hare Kṛṣṇa Hare Kṛṣṇa, Kṛṣṇa Kṛṣṇa Hare Hare —
              </p>
              <p
                className="text-center text-[12px] italic"
                style={{ color: `${PINE_SOFT}99` }}
              >
                Your servants in the service of Śrīla Prabhupāda
              </p>
            </div>

            <Divider />

            {/* Action — primary Pine button per design.md */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={close}
                className="group relative overflow-hidden rounded-full px-7 py-2.5 text-[12px] font-semibold tracking-[0.22em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_-10px_rgba(0,0,0,0.4)] transition-all"
                style={{
                  backgroundColor: PINE,
                  color: LINEN,
                  border: `1px solid ${SAND_DEEP}`,
                }}
              >
                <span className="relative">Enter the Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom dowel */}
        <div className="relative z-10 mx-auto -mt-2 h-5 w-[calc(100%+24px)] -translate-x-3 rounded-full royal-dowel">
          <div className="absolute -left-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full royal-dowel-cap" />
          <div className="absolute -right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full royal-dowel-cap" />
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-7 flex items-center justify-center gap-3">
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(138, 119, 88, 0.6), transparent)",
        }}
      />
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 flex-shrink-0"
        fill="currentColor"
        style={{ color: SAND_DEEP }}
      >
        <path d="M12 1l2.4 6.5L21 9.5l-5.3 4 1.9 7-5.6-3.7L6.4 20.5l1.9-7L3 9.5l6.6-2z" />
      </svg>
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(138, 119, 88, 0.6), transparent)",
        }}
      />
    </div>
  );
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`h-7 w-7 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      style={{ color: `${SAND_DEEP}88` }}
    >
      <path d="M2 12 Q2 2 12 2" />
      <path d="M6 14 Q6 6 14 6" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}
