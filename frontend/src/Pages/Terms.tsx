import React from "react";
import { Navbar } from "../Components/Navbar";
import GavelIcon from "@mui/icons-material/Gavel";
import CopyrightIcon from "@mui/icons-material/Copyright";
import VerifiedIcon from "@mui/icons-material/Verified";
import { Gavel } from "lucide-react";

// ---------------- GlowBlob ----------------
const GlowBlob: React.FC = () => (
  <>
    <div className="pointer-events-none absolute -left-40 -top-40 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#00FFFF]/30 via-[#00FFFF]/10 to-[#FF00FF]/5 blur-3xl transform-gpu animate-blob opacity-60" />
    <div className="pointer-events-none absolute -right-40 -bottom-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#FF00FF]/25 via-[#FF00FF]/10 to-[#00FFFF]/5 blur-2xl transform-gpu animate-blob animation-delay-2000 opacity-60" />
  </>
);

// ---------------- License Content ----------------

const LicenseHero: React.FC = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-6 p-15">
    {/* Animated background gradient orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
    </div>

    <div className="relative text-center">
      {/* Icon container with enhanced effects */}
      <div className="inline-flex items-center justify-center mb-8">
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-400/30 blur-xl animate-pulse"></div>

          {/* Icon container */}
          <div className="relative h-24 w-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-fuchsia-500/20 border border-cyan-400/30 backdrop-blur-sm">
            <Gavel className="text-cyan-400 w-14 h-14 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
          </div>
        </div>
      </div>

      {/* Title with enhanced typography */}
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight text-white mb-6">
        <span className="inline-block bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] animate-pulse">
          MIT
        </span>{" "}
        <span className="inline-block">License</span>
      </h1>

      {/* Subtitle with better spacing */}
      <p className="mt-6 text-gray-300 max-w-2xl mx-auto text-xl leading-relaxed">
        Open source, permissive, and developer-friendly
      </p>

      {/* Decorative line */}
      <div className="mt-12 flex items-center justify-center gap-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/50"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50"></div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/50"></div>
      </div>
    </div>
  </section>
);

interface LicenseCardProps {
  title: string;
  description: string;
  Icon: React.FC;
}

const LicenseCard: React.FC<LicenseCardProps> = ({
  title,
  description,
  Icon,
}) => (
  <div className="p-6 glass-dark border border-[#00FFFF]/20 rounded-xl backdrop-blur-md hover:scale-[1.02] transform transition shadow-xl shadow-black/50 hover:border-[#FF00FF]/40">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-lg bg-gradient-to-br from-[#00FFFF]/30 to-[#FF00FF]/10 neon-shadow-sm-cyan">
        <Icon />
      </div>
      <div>
        <div className="font-semibold text-white text-lg tracking-wide">
          {title}
        </div>
        <div className="text-sm text-gray-300/80 mt-1">{description}</div>
      </div>
    </div>
  </div>
);

const LicenseHighlights: React.FC = () => (
  <section className="max-w-5xl mx-auto px-6 pb-12">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <LicenseCard
        title="Commercial Use"
        description="Use this software for commercial purposes without restrictions."
        Icon={CopyrightIcon}
      />
      <LicenseCard
        title="Modification"
        description="Modify and distribute modified versions of the software freely."
        Icon={GavelIcon}
      />
      <LicenseCard
        title="Distribution"
        description="Distribute copies of the original or modified software."
        Icon={VerifiedIcon}
      />
    </div>
  </section>
);

const LicenseText: React.FC = () => (
  <section className="max-w-5xl mx-auto px-6 py-8">
    <div className="glass-dark border border-gray-800/80 rounded-2xl p-8 shadow-2xl shadow-black/50">
      <div className="font-mono text-sm text-gray-300 leading-relaxed space-y-4">
        <p className="text-[#00FFFF] font-bold text-base">MIT License</p>

        <p>Copyright (c) {new Date().getFullYear()} Vivek Raj</p>

        <p>
          Permission is hereby granted, free of charge, to any person obtaining
          a copy of this software and associated documentation files (the
          "Software"), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to
          permit persons to whom the Software is furnished to do so, subject to
          the following conditions:
        </p>

        <p>
          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.
        </p>

        <p className="text-gray-400 italic">
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </p>
      </div>
    </div>
  </section>
);

// ---------------- Footer ----------------
const Footer: React.FC = () => (
  <footer className="mt-12 border-t border-gray-800/70">
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
      <div className="text-center md:text-left">
        © {new Date().getFullYear()} IITGnGPT — All rights reserved.
      </div>
      <div className="flex items-center gap-6 mt-3 md:mt-0">
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Privacy
        </a>
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Terms
        </a>
        <a
          href="#"
          className="hover:text-[#00FFFF] transition font-mono tracking-wider"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

// ---------------- License Page ----------------
const LicensePage: React.FC = () => (
  <div className="relative min-h-screen text-gray-200 overflow-x-hidden">
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_#0A1433_0%,_#000000_80%)] z-0 pointer-events-none">
      <GlowBlob />
      <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.01))]" />
    </div>

    <div className="relative z-20">
      <Navbar />
      <main id="license">
        <LicenseHero />
        <LicenseHighlights />
        <LicenseText />
      </main>
      <Footer />
    </div>

    <style>{`
      .glass-dark {
        background-color: rgba(10, 20, 51, 0.3);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .neon-shadow-sm {
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.6));
      }
      .neon-shadow-sm-cyan {
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      .drop-shadow-neon-cyan {
        filter: drop-shadow(0 0 6px #00FFFF) drop-shadow(0 0 12px rgba(0, 255, 255, 0.3));
      }
      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(-20px, 20px) scale(1.1); }
        66% { transform: translate(20px, -15px) scale(0.9); }
      }
      .animate-blob { animation: blob 10s infinite cubic-bezier(0.645, 0.045, 0.355, 1); }
      .animation-delay-2000 { animation-delay: 2s; }
    `}</style>
  </div>
);

export default LicensePage;
