import { useEffect, useState } from "react";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { Navbar } from "../Components/Navbar";
// Placeholder for team member photos
import ProfilePlaceholder from '../assets/Team/NoImg.webp'; 
import Brain from '../assets/Brain.png' // Reusing Brain for consistency/GlowBlob
import VivekRaj from '../assets/Team/Vivek Raj.webp'
import Venkat from '../assets/Team/Venkat.png'
import Sharvari from '../assets/Team/Sharvari.png'
import Hari from '../assets/Team/Hari.png'
import Aesha from '../assets/Team/Aesha.jpeg'


// --- Reusable Components/Styles from Home.jsx ---

// ---------------- GlowBlob (Background Animation) ----------------
const GlowBlob = () => (
  <>
    <div className="pointer-events-none absolute -left-40 -top-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#00FFFF]/40 via-[#00FFFF]/15 to-[#FF00FF]/10 blur-3xl transform-gpu animate-blob opacity-70" />
    <div className="pointer-events-none absolute -right-40 -bottom-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#FF00FF]/35 via-[#FF00FF]/15 to-[#00FFFF]/10 blur-3xl transform-gpu animate-blob animation-delay-2000 opacity-70" />
    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 blur-3xl transform-gpu animate-blob animation-delay-4000 opacity-50" />
  </>
);

// ---------------- Footer ----------------
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


// ---------------- Data Structure for Team Members ----------------
const teamData = [
  {
    name: "Vivek Raj",
    photo: VivekRaj, // Use actual path
    designation: "Full Stack Developer & ML Integrations",
    linkedin: "#",
    email: "vivek.raj@iitgn.ac.in",
    delay: "0s"
  },
  {
    name: "Venkatakrishnan E",
    photo: Venkat,
    designation: "ML Integrations",
    linkedin: "#",
    email: "venkatakrishnan.e@iitgn.ac.in",
    delay: "0.2s"
  },
  {
    name: "Sharvari Mirge",
    photo: Sharvari,
    designation: "ML Integrations",
    linkedin: "#",
    email: "sharvari.mirge@iitgn.ac.in",
    delay: "0.4s"
  },
  {
    name: "Harinarayan J",
    photo: Hari,
    designation: "ML Integrations",
    linkedin: "#",
    email: "harinarayan.j@iitgn.ac.in",
    delay: "0.6s"
  },
  {
    name: "Tanish Yelgoe",
    photo: ProfilePlaceholder,
    designation: "ML Integrations",
    linkedin: "#",
    email: "tanish.yelgoe@iitgn.ac.in",
    delay: "0.8s"
  },
  {
    name: "Aeshaa Shah",
    photo: Aesha,
    designation: "ML Integrations",
    linkedin: "#",
    email: "aeshaa.shah@iitgn.ac.in",
    delay: "0.8s"
  },
   {
    name: "Pranshu Patel",
    photo: ProfilePlaceholder,
    designation: "ML Integrations",
    linkedin: "#",
    email: "pranshu.patel@iitgn.ac.in",
    delay: "0.8s"
  },
  
];


// ---------------- TeamMemberCard Component ----------------
//@ts-expect-error
const TeamMemberCard = ({ name, photo, designation, linkedin, email, delay }) => (
  <div 
    className="team-card p-6 glass-dark border border-[#00FFFF]/20 rounded-2xl backdrop-blur-md hover:scale-[1.03] transform transition-all duration-500 shadow-xl shadow-black/50 hover:border-[#FF00FF]/50 cursor-pointer text-center"
    style={{ animationDelay: delay }}
  >
    {/* Photo */}
    <div className="w-50 h-50 mx-auto rounded-full overflow-hidden border-4 border-[#FF00FF]/50 p-0.5 mb-4 group-hover:border-[#00FFFF]/70 transition-colors duration-300 relative">
        <img 
            src={photo} 
            alt={name} 
            className="w-full h-full object-cover rounded-full filter hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 rounded-full border border-dashed border-[#00FFFF]/50 animate-spin-slow" /> 
    </div>
    
    {/* Info */}
    <div className="font-bold text-white text-lg tracking-wide mb-1 drop-shadow-neon-cyan">
      {name}
    </div>
    <div className="text-sm text-gray-400 mb-4 tracking-tight font-medium">
      {designation}
    </div>

    {/* Social Links */}
    <div className="flex justify-center gap-4">
      <a 
        href={linkedin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-500 hover:text-[#00FFFF] transition-colors duration-300"
        title={`Connect with ${name} on LinkedIn`}
      >
        <LinkedInIcon className="h-6 w-6" />
      </a>
      <a 
        href={`mailto:${email}`} 
        className="text-gray-500 hover:text-[#FF00FF] transition-colors duration-300"
        title={`Email ${name}`}
      >
        <MailOutlineIcon className="h-6 w-6" />
      </a>
    </div>
  </div>
);


// ---------------- Main Team Component ----------------
const Team = () => (
  <div className="relative min-h-screen text-gray-200 overflow-x-hidden">
    {/* Background Setup */}
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_#0A1433_0%,_#000000_80%)] z-0 pointer-events-none">
      <GlowBlob />
      <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.01))]" />
    </div>

    <div className="relative z-20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-20 md:py-36">

        {/* --- Team Hero/Title Section --- */}
        <header className="text-center mb-16 animate-slide-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white">
                Meet the  <span className="text-[#FF00FF] drop-shadow-neon-magenta">Team</span>
            </h1>
        </header>

        {/* --- Team Grid --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teamData.map((member, index) => (
            <TeamMemberCard 
              key={index}
              {...member} 
              delay={member.delay} // Use the predefined delay
            />
          ))}
        </section>

      </main>
      <Footer />
    </div>

    {/* Custom Styles/Keyframes */}
    <style>{`
      /* Reused from Home.jsx */
      .glass-dark {
        background-color: rgba(10, 20, 51, 0.4);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .drop-shadow-neon-cyan {
        filter: drop-shadow(0 0 8px #00FFFF) drop-shadow(0 0 16px rgba(0, 255, 255, 0.4));
      }
      .drop-shadow-neon-magenta {
        filter: drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 16px rgba(255, 0, 255, 0.4));
      }
      
      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(-30px, 30px) scale(1.15); }
        66% { transform: translate(30px, -25px) scale(0.9); }
      }
      .animate-blob { animation: blob 12s infinite cubic-bezier(0.645, 0.045, 0.355, 1); }

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
      .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
      
      /* New for Team Card */
      .team-card {
        animation: slide-up 0.8s ease-out forwards;
        opacity: 0;
      }
      
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
      }

    `}</style>
  </div>
);

export default Team;