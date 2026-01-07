import { useState } from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo-white.png";
import backdrop from "../assets/IITGN-evening.jpg";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../Store";
import { loginUser } from "../Store/Login";
import { useNavigate } from "react-router-dom";
import { LOGIN_API_URL } from "../Urls";
import { setUser } from "../Store/User";
import { setProjects } from "../Store/Projects";
import { useGoogleLoginHandler, getGoogleUser } from "../Utils/GoogleAuth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();

  const handleClick = useGoogleLoginHandler(
    async (access_token) => {
      const user = await getGoogleUser(access_token);
      if (!user.email || !user.email.endsWith("@iitgn.ac.in")) {
        setError("Please use your IITGN email to sign in.");
      } else {
        console.log("Login successful:", user.email);
        setLoading(true);
        const loginResponse = await fetch(LOGIN_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email, name: user.name }),
        });
        if (loginResponse.status !== 200) {
          setError("Server error during login. Please try again later.");
          setLoading(false);
          return;
        }

        const loginResponseData = await loginResponse.json();
        if (
          !loginResponseData.token ||
          !loginResponseData.user ||
          loginResponseData.projects === undefined
        ) {
          setError("Server error during login. Please try again later.");
          setLoading(false);
          return;
        }
        dispatch(setUser(loginResponseData.user));
        dispatch(setProjects(loginResponseData.projects));
        dispatch(
          loginUser({
            name: user.name || "User",
            email: user.email,
            JWTToken: loginResponseData.token,
          })
        );

        navigate("/dashboard");
      }
    },
    (err) => {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    }
  );
  // const handleClick = async () => {
  //   setError("");
  //   const provider = new GoogleAuthProvider();

  //   try {
  //     const result = await signInWithPopup(auth, provider);

  //     const user = result.user;

  //     if (!user.email || !user.email.endsWith("@iitgn.ac.in")) {
  //       setError("Please use your IITGN email to sign in.");
  //       await auth.signOut();
  //     } else {
  //       console.log("Login successful:", user.email);
  //       setLoading(true);
  //       const loginResponse = await fetch(LOGIN_API_URL, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ email: user.email, name: user.displayName }),
  //       });
  //       if (loginResponse.status !== 200) {
  //         setError("Server error during login. Please try again later.");
  //         setLoading(false);
  //         return;
  //       }

  //       const loginResponseData = await loginResponse.json();
  //       if (
  //         !loginResponseData.token ||
  //         !loginResponseData.user ||
  //         loginResponseData.projects === undefined
  //       ) {
  //         setError("Server error during login. Please try again later.");
  //         setLoading(false);
  //         return;
  //       }
  //       dispatch(setUser(loginResponseData.user));
  //       dispatch(setProjects(loginResponseData.projects));
  //       dispatch(
  //         login({
  //           name: user.displayName || "User",
  //           email: user.email,
  //           JWTToken: loginResponseData.token,
  //         })
  //       );

  //       navigate("/dashboard");
  //       // window.location.href = "/dashboard";
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setError("Failed to sign in. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden text-gray-100">
      {/* Blurred backdrop image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-[0.5] border=0"
        style={{ backgroundImage: `url(${backdrop})` }}
      ></div>

      {/* Semi-transparent dark overlay for depth */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 w-full max-w-md text-center"
      >
        <img
          src={logo}
          alt="IITGN Logo"
          className="h-32 w-32 mx-auto mb-4 drop-shadow-xl"
        />

        <h1 className="text-2xl font-semibold mb-2 text-white">
          User Authentication
        </h1>
        <p className="text-sm text-gray-300 mb-6">
          Please use your <b className="text-indigo-400">IITGN email</b> to log
          in. Unauthorized access is prohibited. Your IP is logged for security.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleClick()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-70 shadow-lg"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          ) : (
            <>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Sign in with Google
            </>
          )}
        </motion.button>

        {error && (
          <p className="mt-4 text-sm text-red-400 font-medium">{error}</p>
        )}

        <div className="mt-6 border-t border-white/20 pt-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} IIT Gandhinagar. All Rights Reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
