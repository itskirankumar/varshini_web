'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSectionProgress } from '@/lib/useSectionProgress';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 01 — Hero.
 *
 * The headline itself lives in WebGL (HeroScene); this is the DOM furniture
 * around it, plus the ScrollTrigger that publishes hero progress to the scene.
 * The section is 250vh tall and pinned, which gives the fly-through room to
 * play out at a readable pace.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const chrome = useRef<HTMLDivElement>(null);

  useSectionProgress(root, 'hero');

  useEffect(() => {
    const ctx = gsap.context(() => {
      // All surrounding chrome clears out early — from here the scene carries
      // the fly-through on its own, which is the whole point of the section.
      gsap.to('[data-hero-chrome]', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '28% top',
          scrub: true,
        },
      });
      gsap.to(chrome.current, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '28% top',
          scrub: true,
        },
      });

      gsap.set('[data-hero-fade]', { opacity: 0, y: 24 });
      gsap.to('[data-hero-fade]', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.25,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[260vh]">
      {/* A light neutral scrim, concentrated where the type sits rather than
          washed over the whole frame — enough to hold white headline contrast
          against the sunlit plant, without dulling the photograph. */}
      <div
        className="pointer-events-none sticky top-0 -mb-[100vh] h-screen"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,20,16,0.26) 0%, rgba(18,20,16,0.04) 24%, rgba(18,20,16,0.02) 46%, rgba(18,20,16,0.34) 100%)',
        }}
      />

      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden px-6 py-8 md:px-12 md:py-10">
        <div ref={chrome} data-hero-chrome className="on-photo flex flex-col gap-8">
          <header className="flex items-start justify-between">
            <div data-hero-fade>
              <p className="font-display text-3xl leading-none tracking-tight text-white md:text-5xl">
                VARSHINI
              </p>
              <p className="mt-1.5 font-serif text-lg italic text-accent/90 md:text-2xl">
                Fertilizers Pvt Ltd
              </p>
            </div>

            <nav
              data-hero-fade
              className="hidden items-center gap-8 text-[length:var(--text-eyebrow)] uppercase tracking-[0.25em] text-white md:flex"
            >
              <a className="pointer-events-auto transition-colors hover:text-white" href="#group">
                The Group
              </a>
              <a className="pointer-events-auto transition-colors hover:text-white" href="#process">
                Process
              </a>
              <a className="pointer-events-auto transition-colors hover:text-white" href="#catalogue">
                Catalogue
              </a>
              <a
                className="pointer-events-auto rounded-full border border-accent/80 bg-accent/12 px-5 py-2 text-white shadow-[0_6px_24px_-10px_rgba(10,12,8,0.7)] transition-colors hover:bg-accent hover:text-paper"
                href="#start"
              >
                Get Started
              </a>
            </nav>
          </header>

          <div data-hero-fade className="max-w-md">
            <p className="inline-flex items-center gap-3.5 text-sm uppercase tracking-[0.28em] text-white md:text-base">
              <span className="block h-2 w-2 shrink-0 rounded-full bg-accent" />
              01 — White-label manufacturing
            </p>
          </div>
        </div>

        <div data-hero-chrome className="on-photo flex items-end justify-between gap-8">
          <p
            data-hero-fade
            className="max-w-sm text-sm leading-relaxed text-white md:text-base"
          >
            Organic, bio and NPK fertilizers manufactured at scale in Karnataka —
            packed under <span className="font-serif italic text-white">your</span> label.
          </p>

          <div
            data-hero-fade
            className="flex shrink-0 flex-col items-end gap-2 text-[length:var(--text-eyebrow)] uppercase tracking-[0.25em] text-accent/85"
          >
            <span>Scroll</span>
            <span className="block h-12 w-px bg-accent/45" />
          </div>
        </div>
      </div>
    </section>
  );
}
