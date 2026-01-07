import { useState, useEffect } from "react";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import PrivacyTipIcon from '@mui/icons-material/Fingerprint';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import {Navbar} from "../Components/Navbar";
import Brain from '../assets/Brain.png'

// Brain image placeholder
const BrainImage = () => (
  <div className="w-full h-full flex items-center justify-center">
    <img src={Brain} alt="Brain" className="w-120 h-120" />
  </div>
);

// ---------------- Enhanced GlowBlob ----------------
const GlowBlob = () => (
  <>
    <div className="pointer-events-none absolute -left-40 -top-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#00FFFF]/40 via-[#00FFFF]/15 to-[#FF00FF]/10 blur-3xl transform-gpu animate-blob opacity-70" />
    <div className="pointer-events-none absolute -right-40 -bottom-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#FF00FF]/35 via-[#FF00FF]/15 to-[#00FFFF]/10 blur-3xl transform-gpu animate-blob animation-delay-2000 opacity-70" />
    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 blur-3xl transform-gpu animate-blob animation-delay-4000 opacity-50" />
  </>
);

// ---------------- Floating Stats Component ----------------
const FloatingStats = () => {
  const stats = [
    { value: "99.2%", label: "Accuracy", delay: "0s" },
    { value: "<2s", label: "Scan Time", delay: "0.2s" },
    { value: "50K+", label: "Papers Analyzed", delay: "0.4s" },
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="stat-card px-6 py-4 glass-dark border border-[#00FFFF]/30 rounded-xl backdrop-blur-md hover:scale-105 transform transition-all duration-300"
          style={{ animationDelay: stat.delay }}
        >
          <div className="text-2xl font-bold text-[#00FFFF] drop-shadow-neon-cyan">
            {stat.value}
          </div>
          <div className="text-xs text-gray-400 mt-1 tracking-wide">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------- Enhanced Hero ----------------
const Hero = () => {
  const [typedText, setTypedText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const fullText = "Protect academic integrity with confidence";

  useEffect(() => {
    setIsMobile(window.innerWidth <= 640);
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const loginButtonText = isMobile ? (
    <>
      View Mobile Site
      <ArrowForwardIcon className="opacity-90" />
    </>
  ) : (
    <>
      Login to Dashboard
      <ArrowForwardIcon className="opacity-90" />
    </>
  );

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-5 md:py-36 flex flex-col lg:flex-row items-center gap-2">
      <div className="flex-1 text-center lg:text-left">
       
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white animate-slide-up">
          <span className="text-[#00FFFF] drop-shadow-neon-cyan">
            AI Detection
          </span>{" "}
          for Academia &{" "}
          <span className="text-[#FF00FF] drop-shadow-neon-magenta">
            Research
          </span>
        </h1>
        
        <p className="mt-6 text-gray-300 max-w-xl text-lg opacity-90 leading-relaxed animate-slide-up animation-delay-200">
          {typedText}
          <span className="inline-block w-0.5 h-5 bg-[#00FFFF] ml-1 animate-blink" />
        </p>
        
        <p className="mt-4 text-gray-400 max-w-xl text-base animate-slide-up animation-delay-400">
          Run precise checks tuned for thesis, journals, and academic writing — 
          <span className="text-[#FF00FF] font-semibold"> privacy-first</span>, 
          premium-grade confidence scores.
        </p>

        <FloatingStats />

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up animation-delay-600">
          <a
            href={isMobile ? "#" : "/login"}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-extrabold shadow-2xl transform transition-all duration-300 hover:shadow-neon ${
              isMobile
                ? "bg-gray-700 text-gray-300 cursor-not-allowed opacity-80"
                : "bg-gradient-to-r from-[#FF00FF] to-[#00FFFF] text-black hover:scale-105"
            }`}
          >
            {loginButtonText}
          </a>
          <a
            href="#features"
            className="text-sm text-gray-200 px-6 py-3 rounded-full border-2 border-[#00FFFF]/40 hover:bg-[#00FFFF]/20 hover:border-[#00FFFF]/60 transition-all duration-300 font-semibold tracking-wide backdrop-blur-sm"
          >
            Learn more
          </a>
        </div>
      </div>

      <div className="flex-1 flex justify-center lg:justify-end mt-10 lg:mt-0 relative">
        <div className="relative animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/20 to-[#FF00FF]/20 rounded-full blur-3xl" />
          <div className="relative">
            <BrainImage />
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------- Enhanced FeatureCard ----------------
//@ts-expect-error
const FeatureCard = ({ title, desc, Icon, delay }) => (
  <div 
    className="feature-card p-8 glass-dark border border-[#00FFFF]/20 rounded-2xl backdrop-blur-md hover:scale-105 transform transition-all duration-500 shadow-xl shadow-black/50 hover:border-[#FF00FF]/50 cursor-pointer group"
    style={{ animationDelay: delay }}
  >
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#00FFFF]/30 to-[#FF00FF]/20 neon-shadow-sm-cyan w-fit group-hover:scale-110 transition-transform duration-300">
        {Icon}
      </div>
      <div>
        <div className="font-bold text-white text-xl tracking-wide mb-2">
          {title}
        </div>
        <div className="text-sm text-gray-300/90 leading-relaxed">{desc}</div>
      </div>
    </div>
  </div>
);

// ---------------- Enhanced Features ----------------
const Features = () => (
  <section id="features" className="max-w-7xl mx-auto px-6 py-5">
    <div className="text-center">     
      <h3 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
        Built for <span className="text-[#00FFFF]">researchers</span>, educators
        <br />
        and institutions
      </h3>
      <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg opacity-90 leading-relaxed">
        A focused toolset: accurate detection, interpretable scores, and
        academic workflows designed for excellence.
      </p>
    </div>

    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
      <FeatureCard
        title="Research-Optimized"
        desc="Advanced scoring algorithms tuned specifically for complex academic prose, citations, and scholarly writing patterns."
        Icon={<SchoolIcon className="h-8 w-8 text-[#00FFFF]" />}
        delay="0s"
      />
      <FeatureCard
        title="Privacy First"
        desc="Zero data retention by default. Full on-premises deployment options available for ultimate control and compliance."
        Icon={<PrivacyTipIcon className="h-8 w-8 text-[#00FFFF]" />}
        delay="0.2s"
      />
      <FeatureCard
        title="API & Integrations"
        desc="Seamless integration with LMS platforms, Turnitin-style workflows, bulk processing, and comprehensive CSV export."
        Icon={<IntegrationInstructionsIcon className="h-8 w-8 text-[#00FFFF]" />}
        delay="0.4s"
      />
    </div>

    {/* Additional Benefits Row */}
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { icon: <SpeedIcon className="h-6 w-6" />, text: "Lightning-fast processing", color: "#00FFFF" },
        { icon: <CheckCircleIcon className="h-6 w-6" />, text: "99%+ accuracy rate", color: "#FF00FF" },
        { icon: <SecurityIcon className="h-6 w-6" />, text: "Enterprise-grade security", color: "#00FFFF" },
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 p-4 glass-dark rounded-xl border border-gray-800/50 hover:border-[#00FFFF]/30 transition-all duration-300"
        >
          <div className="text-[#00FFFF]">{item.icon}</div>
          <span className="text-gray-300 text-sm font-medium">{item.text}</span>
        </div>
      ))}
    </div>
  </section>
);

// ---------------- Enhanced TrustedBy ----------------
const TrustedBy = () => (
  <section className="max-w-7xl mx-auto px-6 py-16">
    <div className="glass-dark border border-[#00FFFF]/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50 backdrop-blur-md hover:border-[#FF00FF]/30 transition-all duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <div className="text-xs text-[#00FFFF] tracking-widest font-bold mb-2">
            TRUSTED BY LEADING INSTITUTIONS
          </div>
          <div className="text-white font-bold text-2xl tracking-tight">
            Universities • Research Labs • Academic Journals
          </div>
          <p className="text-gray-400 text-sm mt-2 max-w-md">
            Join thousands of institutions worldwide protecting academic integrity
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6">
          {["IITGN", "ResearchLab", "Journal"].map((name, idx) => (
            <div
              key={name}
              className="h-12 w-32 bg-gradient-to-br from-white/10 to-white/5 rounded-lg flex items-center justify-center font-bold text-white tracking-wider transition-all duration-300 transform hover:scale-110 hover:bg-white/15 border border-[#FF00FF]/30 shadow-lg hover:shadow-neon-sm"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ---------------- Enhanced Footer ----------------
const Footer = () => (
  <footer className="mt-16 border-t border-gray-800/70">
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
      <div className="text-center md:text-left">
        <div className="text-white font-bold text-lg mb-1">IITGnGPT</div>
        <div className="text-[#00FFFF] text-sm font-semibold mb-1">
          Developed by LINGO Labs, IIT Gandhinagar
        </div>
        <div>© {new Date().getFullYear()} — All rights reserved.</div>
      </div>
      <div className="flex items-center gap-8 mt-4 md:mt-0">
        {["Privacy", "Terms", "Contact"].map((link) => (
          <a
            key={link}
            href="#"
            className="hover:text-[#00FFFF] transition-all duration-300 font-medium tracking-wide hover:scale-110 transform"
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

// ---------------- Main Home Component ----------------
const Home = () => (
  <div className="relative min-h-screen text-gray-200 overflow-x-hidden">
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_#0A1433_0%,_#000000_80%)] z-0 pointer-events-none">
      <GlowBlob />
      <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.01))]" />
    </div>

    <div className="relative z-20">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TrustedBy />
      </main>
      <Footer />
    </div>

    <style>{`
      .glass-dark {
        background-color: rgba(10, 20, 51, 0.4);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .neon-shadow-sm-cyan {
        box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }
      
      .drop-shadow-neon-cyan {
        filter: drop-shadow(0 0 8px #00FFFF) drop-shadow(0 0 16px rgba(0, 255, 255, 0.4));
      }
      
      .drop-shadow-neon-magenta {
        filter: drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 16px rgba(255, 0, 255, 0.4));
      }
      
      .drop-shadow-neon-lg {
        filter: drop-shadow(0 0 15px #00FFFF) drop-shadow(0 0 30px #FF00FF);
      }
      
      .shadow-neon-sm {
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
      }
      
      .shadow-neon {
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.7), 0 0 30px rgba(255, 0, 255, 0.5);
      }

      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(-30px, 30px) scale(1.15); }
        66% { transform: translate(30px, -25px) scale(0.9); }
      }
      .animate-blob { animation: blob 12s infinite cubic-bezier(0.645, 0.045, 0.355, 1); }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in { animation: fade-in 0.8s ease-out; }

      @keyframes slide-up {
        from { 
          opacity: 0;
          transform: translateY(30px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }

      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      .animate-blink { animation: blink 1s infinite; }

      .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
      .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
      .animation-delay-600 { animation-delay: 0.6s; opacity: 0; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }

      .stat-card {
        animation: slide-up 0.8s ease-out forwards;
        opacity: 0;
      }

      .feature-card {
        animation: slide-up 0.8s ease-out forwards;
        opacity: 0;
      }
    `}</style>
  </div>
);

export default Home;