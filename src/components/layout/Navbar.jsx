import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      className="fixed left-0 top-0 z-50 w-full"
    >
      <div className="page-padding pt-5">
        <div className="glass-panel mx-auto flex h-[58px] max-w-[1520px] items-center gap-3 overflow-hidden rounded-full px-4 md:justify-between md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)] shadow-[0_0_20px_rgba(139,163,255,0.9)]" />

            <div className="leading-none">
              <p className="mono-font text-[0.48rem] uppercase tracking-[0.22em] text-dim">
                Financial Memory System
              </p>

              <h1 className="system-font mt-1 text-[0.82rem] font-semibold tracking-[-0.02em] text-white">
                ECONOGRAPHY
              </h1>
            </div>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-none md:gap-7 md:px-0">
            <NavItem to="/btc">Bitcoin</NavItem>
            <NavItem to="/art-space">Art Space</NavItem>
            <NavItem to="/research">Research</NavItem>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-2 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />

              <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                Stream Active
              </p>
            </div>

            <Link
              to="/art-space"
              className="hidden rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 font-sans text-[0.76rem] text-white/75 transition duration-500 hover:bg-white hover:text-black sm:inline-flex"
            >
              Open Art Space
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        mono-font shrink-0 text-[0.5rem] uppercase tracking-[0.15em]
        transition duration-500 md:text-[0.52rem] md:tracking-[0.18em]
        ${isActive ? "text-white" : "text-white/42 hover:text-white"}
      `
      }
    >
      {children}
    </NavLink>
  );
}