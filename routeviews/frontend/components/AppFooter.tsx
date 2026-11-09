'use client';
import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();

  // Hide footer on the Plan page
  if (pathname === '/plan') {
    return null;
  }

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-electric flex items-center justify-center text-white font-bold text-xs">
                CR
              </div>
              <span className="font-semibold text-ink">ConnectRwanda AI</span>
            </div>
            <p className="text-sm text-ink-100 leading-relaxed max-w-xs">
              AI-powered public transport and accessibility intelligence for Rwanda.
            </p>
          </div>
          <div>
            <div className="font-semibold text-ink text-sm mb-3">Passengers</div>
            <ul className="space-y-2 text-sm text-ink-100">
              <li><a href="/plan" className="hover:text-electric">Plan a journey</a></li>
              <li><a href="/explore" className="hover:text-electric">Explore places</a></li>
              <li><a href="/map" className="hover:text-electric">Live map</a></li>
              <li><a href="/tickets" className="hover:text-electric">Tickets</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ink text-sm mb-3">Business &amp; operators</div>
            <ul className="space-y-2 text-sm text-ink-100">
              <li><a href="/business" className="hover:text-electric">Business dashboard</a></li>
              <li><a href="/submit-place" className="hover:text-electric">Add a place</a></li>
              <li><a href="/admin" className="hover:text-electric">Admin console</a></li>
              <li><a href="/admin/validate" className="hover:text-electric">Validate ticket</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-ink-100">
          <span>© {new Date().getFullYear()} ConnectRwanda AI</span>
        </div>
      </div>
    </footer>
  );
}