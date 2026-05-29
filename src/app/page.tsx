import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-surface min-h-screen">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-atelier mx-auto px-16 pt-32 pb-section">
        <div className="max-w-3xl animate-slide-up">
          <p className="label-caps mb-8">AI Personal Style Assistant</p>
          <h1 className="font-serif text-display font-normal text-on-surface mb-8">
            A sophisticated synthesis of high fashion and machine intelligence.
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mb-12">
            Your wardrobe, analyzed. Your style, elevated. Let our AI act as
            your personal digital couturier — curating, pairing, and perfecting
            every look.
          </p>
          <div className="flex gap-4">
            <Link
              href="/wardrobe/gallery"
              className="px-8 py-4 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150"
            >
              Begin Your Collection
            </Link>
            <Link
              href="/style"
              className="px-8 py-4 border border-on-surface text-on-surface text-sm font-medium tracking-btn uppercase hover:bg-surface-container transition-colors duration-150"
            >
              Define Your Style
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-outline-variant" />

      {/* ── Process ─────────────────────────────────────────────────────────── */}
      <section className="max-w-atelier mx-auto px-16 py-section">
        <p className="label-caps mb-16">The Process</p>
        <div className="grid grid-cols-3 gap-16">
          {[
            {
              num: '01',
              title: 'Digital Scan',
              description:
                'Upload your garments. Our AI performs a detailed analysis of colour, material, silhouette, fit, and visual weight — building the foundation of your digital wardrobe.',
              href: '/wardrobe',
              cta: 'Upload Items',
            },
            {
              num: '02',
              title: 'Outfit Builder',
              description:
                'Submit any piece from your collection. Receive curated pairing suggestions with compatibility scores, styling rationale, and occasion guidance.',
              href: '/wardrobe/suggest-pairing',
              cta: 'Build an Outfit',
            },
            {
              num: '03',
              title: 'Purchase Consultant',
              description:
                'Upload a potential purchase. Receive an honest verdict on whether the piece earns a place in your collection, with professional styling critique.',
              href: '/wardrobe/evaluate-item',
              cta: 'Evaluate a Look',
            },
          ].map(({ num, title, description, href, cta }) => (
            <div key={num} className="border-t border-on-surface pt-8">
              <p className="label-caps text-outline mb-6">{num}</p>
              <h2 className="font-serif text-headline-sm font-normal text-on-surface mb-4">
                {title}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                {description}
              </p>
              <Link
                href={href}
                className="text-sm font-medium text-on-surface tracking-btn uppercase border-b border-on-surface pb-px hover:text-on-surface-variant hover:border-on-surface-variant transition-colors duration-150"
              >
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-outline-variant" />

      {/* ── Quote ───────────────────────────────────────────────────────────── */}
      <section className="max-w-atelier mx-auto px-16 py-24 text-center">
        <blockquote className="font-serif text-headline-sm font-normal text-on-surface-variant max-w-2xl mx-auto leading-relaxed italic">
          &ldquo;Fashion is the armour to survive the reality of everyday life.
          Our AI makes that armour perfect.&rdquo;
        </blockquote>
      </section>

      <div className="border-t border-outline-variant" />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="max-w-atelier mx-auto px-16 py-8 flex justify-between items-center">
        <p className="label-caps text-outline">© 2026 Atelier Digital</p>
        <div className="flex gap-8">
          {[
            { href: '/style', label: 'Style ID' },
            { href: '/wardrobe/gallery', label: 'My Wardrobe' },
            { href: '/wardrobe/suggest-pairing', label: 'Outfit Builder' },
            { href: '/wardrobe/evaluate-item', label: 'Purchase Consultant' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="label-caps hover:text-on-surface transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
