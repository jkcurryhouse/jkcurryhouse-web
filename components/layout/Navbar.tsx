"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Phone, User, LogOut, ChevronDown, ShoppingBag, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { logoutUser } from "@/lib/auth";
import { getAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/brand/Logo";

const navLinks = [
  { href: "/menu",         label: "Menu" },
  { href: "/order",        label: "Order Online" },
  { href: "/reservations", label: "Reserve a Table" },
  { href: "/offers",       label: "Offers" },
  { href: "/#about",       label: "About" },
  { href: "/#contact",     label: "Contact" },
];

export default function Navbar() {
  const [open,          setOpen]          = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const { user, loading }                 = useAuth();
  const { itemCount }                     = useCart();
  const router                            = useRouter();
  const { toast }                         = useToast();

  // Check admin status when user loads
  useEffect(() => {
    if (user) {
      getAdminUser().then((a) => setIsAdmin(!!a));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast("Signed out successfully.", "info");
      router.push("/");
      router.refresh();
      setUserMenuOpen(false);
    } catch {
      toast("Could not sign out.", "error");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/95 backdrop-blur-sm border-b border-gold/20">
      <div className="container-pad">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="JK Curryhouse — home" className="group transition-[filter] hover:brightness-110">
            <Logo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="font-body text-sm text-gray-300 hover:text-saffron-400 transition-colors tracking-wide">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:01249123456" className="flex items-center gap-2 text-gray-300 hover:text-saffron-400 text-sm transition-colors">
              <Phone size={15} />01249 123456
            </a>

            {/* Cart badge */}
            <Link href="/order" className="relative text-gray-300 hover:text-saffron-400 transition-colors">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-spice-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-body">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {!loading && (
              user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-saffron-400 transition-colors border border-gold/30 px-3 py-1.5">
                    <User size={15} />
                    <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                    {isAdmin && <span className="text-gold text-xs font-body ml-1">★</span>}
                    <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-charcoal-800 border border-gold/20 shadow-xl z-50">
                      <div className="px-4 py-3 border-b border-gold/10">
                        <p className="text-white text-sm font-medium font-body truncate">{user.name}</p>
                        <p className="text-gray-500 text-xs font-body truncate">{user.email}</p>
                        {isAdmin && <span className="inline-block mt-1 text-xs bg-gold/20 text-gold px-2 py-0.5 font-body">Admin</span>}
                      </div>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-saffron-400 hover:bg-white/5 transition-colors font-body">
                        <User size={14} />My Account
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gold hover:text-saffron-400 hover:bg-white/5 transition-colors font-body border-t border-gold/10">
                          <Settings size={14} />Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors font-body text-left border-t border-gold/10">
                        <LogOut size={14} />Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="text-sm text-gray-300 hover:text-saffron-400 transition-colors font-body px-3 py-1.5">
                    Sign In
                  </Link>
                  <Link href="/order" className="btn-primary !py-2 !px-5 !text-xs">Order Now</Link>
                </div>
              )
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/order" className="relative text-gray-300">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-spice-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen(!open)} className="text-white p-2" aria-label="Toggle menu">
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-charcoal-900 border-t border-gold/20">
          <nav className="container-pad py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="py-3 text-gray-300 hover:text-saffron-400 transition-colors border-b border-charcoal-700 text-sm">
                {l.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <a href="tel:01249123456" className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone size={15} /> 01249 123456
              </a>
              {user ? (
                <>
                  <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 text-gray-300 text-sm py-2">
                    <User size={15} />{user.name}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 text-gold text-sm py-2">
                      <Settings size={15} />Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm py-2 text-left">
                    <LogOut size={15} />Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="text-gray-300 text-sm py-2">Sign In</Link>
                  <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-primary text-center !py-3">Create Account</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
