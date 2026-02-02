import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/root-causes', label: 'Root Causes' },
  { href: '/segments', label: 'Segments' },
  { href: '/sessions', label: 'Sessions' }
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Drop-off Detective</p>
          <p className="text-lg font-semibold text-slate-900">Shopflo Checkout Intelligence</p>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
