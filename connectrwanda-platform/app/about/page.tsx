// app/about/page.tsx
import Link from "next/link";
import { links } from "@/lib/links";
import { ArrowRight, ShieldCheck } from "@/components/icons";

export const metadata = {
  title: "About — ConnectRwanda AI",
  description:
    "ConnectRwanda AI unites RouteView smart transit intelligence with MapForAll accessibility-first discovery across Rwanda.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            ConnectRwanda <span className="text-sky-600 font-extrabold">AI</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600"
          >
            Back to home <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Mission &amp; Architecture
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          One unified platform for inclusive mobility and local discovery.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
          ConnectRwanda AI unites two independent, production-grade engines under one
          identity: <strong>Transport</strong> (RouteView) delivers real-time bus
          tracking, ML-backed arrival prediction, digital ticketing and AI trip
          planning; <strong>Discover</strong> (MapForAll) reveals accessible places,
          verified entrances, and neighborhood businesses usually omitted from
          commercial maps.
        </p>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          The two engines remain technically independent — separate databases,
          separate authentication, separate AI stacks — but communicate through a
          validated two-way deep-link handshake so a passenger can plan a journey,
          arrive, and discover what&apos;s around them without ever leaving the
          ConnectRwanda AI experience.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex items-start gap-4">
          <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h2 className="font-bold text-slate-900">Architectural invariants</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>RouteView stays on MySQL; MapForAll stays on MongoDB Atlas.</li>
              <li>No shared authentication — each engine authenticates independently.</li>
              <li>RouteView uses OpenRouter; MapForAll uses Google ADK agents.</li>
              <li>
                Cross-app hand-offs carry only validated coordinates + a display
                label + an <code className="bg-slate-200 px-1 rounded">intent</code>{" "}
                hint — never credentials or PII.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={links.routeview.plan}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
          >
            Open Transport <ArrowRight size={14} />
          </a>
          <a
            href={links.mapforall.discover}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
          >
            Open Discover <ArrowRight size={14} />
          </a>
        </div>
      </section>
    </main>
  );
}