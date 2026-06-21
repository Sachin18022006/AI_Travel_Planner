import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FlightPath from '@/components/FlightPath';

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 pt-20 pb-24">
        
        <div className="glow-gold -left-20 -top-10 h-72 w-72" />
        <div className="glow-teal right-0 top-40 h-80 w-80" />

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
          <div className="fade-in-up">
            <p className="stamp mb-4 inline-block rounded border border-stamp-500/40 px-2 py-1 text-xs uppercase text-stamp-500">
              Boarding Pass · Issued by AI Agent
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-paper-50 sm:text-6xl">
              Your trip, planned
              <br />
              before your coffee
              <br />
              gets cold.
            </h1>
            <p className="mt-6 max-w-md text-paper-200/70">
              Tell Voyager where you&apos;re headed, how long you&apos;ve got, and what you love —
              get a full day-by-day itinerary, a realistic budget, hotel picks, and a packing
              list built around the local climate. Edit anything, regenerate any day, instantly.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/register"
                className="rounded-full bg-gold-500 px-6 py-3 font-medium text-ink-950 shadow-lg shadow-gold-500/20 transition-all hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-gold-500/30"
              >
                Plan your first trip
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-ink-600 px-6 py-3 font-medium text-paper-100 transition-colors hover:border-gold-500"
              >
                Log in
              </Link>
            </div>

            <div className="mt-10 hidden sm:block">
              <FlightPath className="h-20 w-full max-w-sm opacity-80" />
            </div>
          </div>

          
          <div className="fade-in-up rounded-2xl border border-ink-700 bg-ink-800/60 p-6 shadow-2xl shadow-black/40 [animation-delay:150ms]">
            <div className="flex items-center justify-between">
              <div>
                <p className="stamp text-xs text-paper-200/50">DESTINATION</p>
                <p className="font-display text-2xl text-paper-50">Kyoto, Japan</p>
              </div>
              <div className="text-right">
                <p className="stamp text-xs text-paper-200/50">DURATION</p>
                <p className="font-display text-2xl text-paper-50">5 Days</p>
              </div>
            </div>

            <div className="ticket-perforation my-6" />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-paper-200/60">Day 1 · Morning</span>
                <span className="text-paper-100">Fushimi Inari Shrine</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-paper-200/60">Day 1 · Afternoon</span>
                <span className="text-paper-100">Gion District Walk</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-paper-200/60">Day 2 · Morning</span>
                <span className="text-paper-100">Arashiyama Bamboo Grove</span>
              </div>
            </div>

            <div className="ticket-perforation my-6" />

            <div className="flex items-center justify-between">
              <div>
                <p className="stamp text-xs text-paper-200/50">EST. BUDGET</p>
                <p className="font-display text-xl text-gold-400">$1,240</p>
              </div>
              <span className="stamp rounded-full border border-teal-400/50 px-3 py-1 text-xs text-teal-400">
                PACKING LIST READY
              </span>
            </div>
          </div>
        </div>

        <section className="relative z-10 mt-28 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: 'AI-built itinerary',
              body: 'A structured day-by-day plan tuned to your interests and budget tier, generated in seconds.',
              accent: 'gold'
            },
            {
              title: 'Live editing',
              body: 'Add or remove activities, or hand a single day back to the AI with new instructions.',
              accent: 'teal'
            },
            {
              title: 'Weather-aware packing',
              body: 'A checklist that accounts for the destination climate and the activities actually planned.',
              accent: 'stamp'
            }
          ].map((f, i) => (
            <div
              key={f.title}
              className="card-lift fade-in-up rounded-xl border border-ink-700 bg-ink-800/40 p-6"
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <span
                className={`mb-3 inline-block h-1.5 w-8 rounded-full ${
                  f.accent === 'gold' ? 'bg-gold-500' : f.accent === 'teal' ? 'bg-teal-400' : 'bg-stamp-500'
                }`}
              />
              <h3 className="font-display text-lg text-paper-50">{f.title}</h3>
              <p className="mt-2 text-sm text-paper-200/70">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
