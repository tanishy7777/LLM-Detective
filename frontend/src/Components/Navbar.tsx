import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

// Assets (assuming these paths are correct)
import logo from "../assets/Logo.png";


const NavLink: React.FC<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}> = ({ children, href = "/", onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className="text-sm text-xl text-white text-gray-300/80 hover:text-cyan-400 hover:shadow-text-cyan transition-colors duration-200 px-3 py-2 rounded-md font-medium tracking-wide"
  >
    {children}
  </Link>
);

const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-8 transition-opacity duration-300 ease-in-out">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="p-2 text-white hover:text-cyan-400"
        >
          <CloseIcon className="h-8 w-8" />
        </button>
      </div>
      <div className="flex flex-col items-start space-y-4 mt-10">
        <NavLink href="/" onClick={onClose}>
          Home
        </NavLink>
        <NavLink href="#" onClick={onClose}>
          About
        </NavLink>
        <NavLink href="#" onClick={onClose}>
          Terms
        </NavLink>
        <button
          onClick={() => {
            navigate("/login");
            onClose();
          }}
          className="mt-6 w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-magenta-500 to-cyan-500 text-black font-bold shadow-lg transform transition duration-300 hover:scale-[1.02]"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = false; // Replace with redux state if needed
  const navigate = useNavigate();
  const handleAuthAction = () => {
    navigate("/login");
  };

  return (
    <header className="w-full z-40 relative">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between glass-dark border-b border-gray-800/60 rounded-none md:rounded-2xl md:mt-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="IITGnGPT"
            className="h-10 w-10 object-contain neon-shadow-sm"
          />
          <div>
            <div className="text-white font-extrabold tracking-widest text-lg">
              IITGnGPT
            </div>
            <div className="text-xs text-cyan-400 -mt-1 font-mono tracking-wider">
              AI Detection
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/team">About</NavLink>
          <NavLink href="/terms">Terms</NavLink>

          <button
            onClick={handleAuthAction}
            className="ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#00FFFF] text-black font-bold shadow-neon-sm transform transition duration-300 hover:scale-105 hover:shadow-neon focus:outline-none"
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(true)}
        >
          <MenuIcon className="h-7 w-7" />
        </button>
      </nav>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
};
