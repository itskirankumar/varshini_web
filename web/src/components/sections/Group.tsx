'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassCard from '@/components/ui/GlassCard';
import Interlude from '@/components/ui/Interlude';
import { useSectionProgress } from '@/lib/useSectionProgress';

gsap.registerPlugin(ScrollTrigger);

const AMRUTH_BULLETS = [
  'Awarded for production performance, workplace culture & safety standards',
  'Recognised for contributions to community and environment',
  'Continuously expanding the product portfolio',
];

const DETAILS = [
  ['Plant', 'Malladihalli, Holalkere TQ, Chitradurga Dist, Karnataka'],
  ['From Chitradurga', '~40 km'],
  ['From Bengaluru', '~245 km'],
  ['Serving', 'Karnataka · Andhra Pradesh · Telangana · Tamil Nadu · Kerala'],
] as const;

/**
 * Section 02 — The Group.
 *
 * Copy is verbatim from the project brief. The card block pins from 1024px up,
 * where two columns of this much copy fit a screen with room to breathe. Below
 * that the cards run in normal flow — pinning them would only make a scroll
 * trap around content taller than the viewport.
 */
export default function Group() {
  const root = useRef<HTMLElement>(null);
  const cards = useRef<HTMLDivElement>(null);

  useSectionProgress(root, 'group');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('[data-group-intro]', { opacity: 0, y: 40 });
      gsap.to('[data-group-intro]', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '[data-group-intro]', start: 'top 85%', once: true },
      });

      // Pinned card choreography — desktop only.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: cards.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        });

        gsap.set('[data-card="amruth"]', { opacity: 0, y: 70 });
        gsap.set('[data-connector]', { opacity: 0, scaleX: 0.3 });
        gsap.set('[data-card="varshini"]', { opacity: 0, y: 70 });

        tl.to('[data-card="amruth"]', { opacity: 1, y: 0, duration: 1 })
          .to('[data-connector]', { opacity: 1, scaleX: 1, duration: 0.6 }, '>-0.25')
          .to('[data-card="varshini"]', { opacity: 1, y: 0, duration: 1 }, '>-0.3')
          .to({}, { duration: 0.8 });
      });

      gsap.set('[data-detail-row]', { opacity: 0, y: 24 });
      gsap.to('[data-detail-row]', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '[data-detail-strip]', start: 'top 88%', once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="group" className="relative">
      <Interlude caption="Section 01 · Inside the plant" height="h-[70vh]" />

      {/* Intro */}
      <div className="surface-blend flex items-center px-6 pb-28 pt-48 md:px-12 md:pb-36 md:pt-64">
        <div className="max-w-3xl">
          <p
            data-group-intro
            className="text-[length:var(--text-eyebrow)] uppercase tracking-[0.3em] text-accent"
          >
            01 — The Group
          </p>
          <h2
            data-group-intro
            className="mt-6 font-display text-[length:var(--text-huge)] leading-[0.95] tracking-tight"
          >
            Two companies.
            <br />
            <span className="font-serif font-normal italic tracking-normal text-accent">
              One plant behind them.
            </span>
          </h2>
          <p
            data-group-intro
            className="mt-8 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg"
          >
            Amruth Groups has spent more than a decade building one of South India&rsquo;s larger
            agro-biotechnology manufacturing units. Varshini is the arm that opens that capacity up
            to retailers who want to sell under their own name.
          </p>
        </div>
      </div>

      {/* Cards — pinned on desktop, stacked in flow on mobile */}
      <div ref={cards} className="relative lg:h-[240vh]">
        <div className="flex flex-col justify-center px-6 py-12 lg:sticky lg:top-0 lg:h-screen lg:px-12 lg:py-0">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-5">
            <div data-card="amruth">
              <GlassCard eyebrow="Parent · Manufacturing" title="Amruth Organic Fertilizers">
                <p>
                  The flagship company, spread across a 30+ acre premise at Malladihalli, Holalkere
                  Taluk, Chitradurga District, Karnataka &mdash; about 40 km from Chitradurga and
                  245 km from Bengaluru.
                </p>
                <p>
                  It manufactures the full bio range: bio-fertilizers, bio-pesticides, organic
                  manure, phosphorous-rich organic manure, bio potash derived from molasses, soil
                  conditioner, neem-based organic manure, growth promoters, micronutrients and coco
                  pith.
                </p>
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {AMRUTH_BULLETS.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>

            {/* Connector */}
            <div
              data-connector
              className="flex items-center justify-center gap-3 lg:w-36 lg:flex-col lg:gap-2"
            >
              <span className="h-px w-10 bg-accent/50 lg:h-10 lg:w-px" />
              <span className="text-center text-[10px] uppercase leading-tight tracking-[0.2em] text-ink-faint">
                supplies &amp;
                <br className="hidden lg:block" /> manufactures for
              </span>
              <span className="h-px w-10 bg-accent/50 lg:h-10 lg:w-px" />
            </div>

            <div data-card="varshini">
              <GlassCard
                eyebrow="Subsidiary · White-Label Supply"
                title="Varshini Fertilizers Pvt Ltd"
                className="border-accent/40 bg-accent-soft"
              >
                <p>
                  Varshini manufactures an array of NPK &amp; water-soluble fertilizers and takes
                  the group&rsquo;s complete organic range to market in a very specific way &mdash;
                  without a brand label on it.
                </p>
                <p>
                  Retailers, agri-input dealers, distributors and FPOs buy finished, tested, packed
                  product and put their own brand name, logo and MRP on it. No factory. No R&amp;D
                  team. No minimum-crore investment. Just your label on a product that is already
                  made at scale.
                </p>
                <a
                  href="#white-label"
                  className="mt-4 inline-block border-b border-accent/45 pb-0.5 text-sm text-accent transition-colors hover:border-accent"
                >
                  See exactly what you get &rarr;
                </a>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Detail strip */}
      <div data-detail-strip className="surface px-6 pb-28 pt-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="rule" />
          <dl className="grid gap-x-8 gap-y-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {DETAILS.map(([label, value]) => (
              <div key={label} data-detail-row>
                <dt className="text-[length:var(--text-eyebrow)] uppercase tracking-[0.2em] text-ink-faint">
                  {label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
