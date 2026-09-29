import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Crown, Languages, LogOut, Menu, ShieldCheck, User, X, BookOpen } from "lucide-react";
import { BRAND } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { Avatar, cx } from "./ui.jsx";

function useTitleReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
}

export function useTitle(title) {
  const { lang } = useI18n();
  useEffect(() => {
    const brand = BRAND.fullName[lang];
    document.title = title ? `${title} | ${brand}` : brand;
  }, [title, lang]);
}

function Logo() {
  const { lang } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-3 flex-shrink-0" aria-label={BRAND.fullName[lang]}>
      <span className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: "var(--gold-grad)", boxShadow: "0 8px 22px -8px rgba(212,175,55,.8)" }}>
        <Crown size={19} style={{ color: "#1A1405" }} strokeWidth={2.4} />
      </span>
      <span className="font-display font-black text-lg leading-none">{BRAND.name[lang]}</span>
    </Link>
  );
}

function Header() {
  const { t, lang, toggle } = useI18n();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const links = [
    { to: "/", label: t("nav.courses"), end: true },
    ...(user ? [{ to: "/my-learning", label: t("nav.myLearning") }] : []),
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];
  const navClass = ({ isActive }) => cx("px-3 py-2 rounded-lg text-sm font-bold transition-colors", isActive ? "gold" : "mute hover:text-white");

  return (
    <header className="sticky top-0 z-40" style={{
      background: scrolled || open ? "rgba(9,12,19,.9)" : "transparent",
      backdropFilter: scrolled ? "blur(18px)" : "none", WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
      borderBottom: `1px solid ${scrolled ? "rgba(212,175,55,.14)" : "transparent"}`, transition: "background .4s, border-color .4s",
    }}>
      <div className="shell flex items-center justify-between gap-4" style={{ height: 70 }}>
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label={t("nav.main")}>
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>{l.label}</NavLink>)}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} className="btn btn-ghost btn-sm" aria-label={t("nav.switchLanguage")}>
            <Languages size={15} /> {lang === "ar" ? "English" : "العربية"}
          </button>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenu((m) => !m)} className="rounded-full" aria-label={t("nav.account")} aria-expanded={menu}>
                <Avatar person={profile || { full_name: user.email }} size={38} />
              </button>
              {menu && (
                <div className="absolute mt-2 rounded-2xl p-2 z-50" style={{ insetInlineEnd: 0, width: 240, background: "rgba(13,18,29,.98)", border: "1px solid var(--line2)", boxShadow: "0 30px 70px -20px rgba(0,0,0,.9)" }}>
                  <div className="px-3 py-2">
                    <div className="font-bold text-sm truncate">{profile?.full_name || user.email}</div>
                    <div className="text-xs dim truncate" dir="ltr">{user.email}</div>
                  </div>
                  <div className="divider my-1" />
                  <Link to="/my-learning" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"><BookOpen size={15} /> {t("nav.myLearning")}</Link>
                  <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"><User size={15} /> {t("nav.account")}</Link>
                  {isAdmin && <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"><ShieldCheck size={15} /> {t("nav.admin")}</Link>}
                  <button type="button" onClick={async () => { await signOut(); navigate("/"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: "#FDA4AF" }}>
                    <LogOut size={15} /> {t("nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-gold btn-sm hidden sm:inline-flex">{t("nav.signIn")}</Link>
          )}
          <button type="button" className="btn btn-ghost btn-sm md:hidden" onClick={() => setOpen((o) => !o)} aria-label={t("nav.menu")} aria-expanded={open}>
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden shell pb-4 flex flex-col gap-1" aria-label={t("nav.main")}>
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>{l.label}</NavLink>)}
          {!user && <Link to="/login" className="btn btn-gold mt-2">{t("nav.signIn")}</Link>}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-24" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell py-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mute text-sm mt-4 leading-relaxed">{BRAND.tagline[lang]}</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link to="/legal/terms" className="mute hover:text-white">{t("legal.terms")}</Link>
          <Link to="/legal/privacy" className="mute hover:text-white">{t("legal.privacy")}</Link>
          <Link to="/legal/refund" className="mute hover:text-white">{t("legal.refund")}</Link>
          <Link to="/verify" className="mute hover:text-white">{t("cert.verifyTitle")}</Link>
          <a href={`mailto:${BRAND.supportEmail}`} className="mute hover:text-white" dir="ltr">{BRAND.supportEmail}</a>
        </div>
      </div>
      <div className="shell pb-8 text-xs dim flex flex-wrap gap-x-4 gap-y-1"><span>© {new Date().getFullYear()} {BRAND.legalEntity[lang]}</span><span>{BRAND.country[lang]}</span></div>
    </footer>
  );
}

export default function Layout() {
  useTitleReset();
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 btn btn-gold z-50">Skip</a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
