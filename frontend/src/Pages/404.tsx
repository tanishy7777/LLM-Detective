import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/IITGN-evening.jpg";
import robotSvg from "../assets/404.svg";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          backdropFilter: "blur(20px)",
          background: "rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "2rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          width: "100%",
          maxWidth: 420,
          minHeight: { xs: "90vh", sm: "auto" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          p: { xs: 4, sm: 6 },
          gap: 3,
        }}
      >
        {/* Robot Illustration */}
        <Box
          component="img"
          src={robotSvg}
          alt="404 Robot"
          sx={{
            width: { xs: "70%", sm: "60%" },
            maxWidth: 260,
            mb: 2,
            filter: "drop-shadow(0 0 15px rgba(0, 200, 255, 0.4))",
            userSelect: "none",
          }}
        />

        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            letterSpacing: 1,
            textShadow: "0 0 10px rgba(255,255,255,0.4)",
          }}
        >
          404
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          sx={{
            opacity: 0.9,
            fontWeight: 400,
            mb: 1,
          }}
        >
          Oops! Page Not Found
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.75)",
            maxWidth: 320,
            mb: 3,
          }}
        >
          Looks like the page you’re looking for doesn’t exist. It might have
          been moved, or maybe it never existed at all.
        </Typography>

        {/* Button */}
        <Button
          onClick={() => navigate("/")}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: "12px",
            background:
              "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 100%)",
            color: "white",
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            "&:hover": {
              background:
                "linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 100%)",
            },
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
}
