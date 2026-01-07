import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import { useSelector } from "react-redux";
import type { RootState } from "../Store";

// --- Type Definitions ---

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

// --- CONSTANTS ---
const API_URL: string = "http://localhost:5000/api/project/new";
const MAX_UPLOAD_SIZE_MB: number = 50;
const MAX_UPLOAD_SIZE_BYTES: number = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

// --- Utility Functions ---
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// --- Styles ---
const textFieldStyle = {
  "& .MuiInputBase-input": { color: "white" },
  "& .MuiInputLabel-root": { color: "white" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "white" },
    "&:hover fieldset": { borderColor: "white" },
    "&.Mui-focused fieldset": { borderColor: "white" },
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "0.75rem",
  },
};

// --- Add Project Form ---
export default function App() {
  const [projectName, setProjectName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>("Start Project Scan");
  const [message, setMessage] = useState<MessageState>(null);

  // JWT Placeholder State (Simulating Redux/Context Load)
  const jwtToken: string | null = useSelector(
    (state: RootState) => state.login.JWTToken
  );

  const isFileSizeValid = useMemo(
    (): boolean => (file ? file.size <= MAX_UPLOAD_SIZE_BYTES : true),
    [file]
  );

  const handleFileChange = useCallback((selectedFile: File): void => {
    if (selectedFile.name.endsWith(".zip")) {
      setFile(selectedFile);
    } else {
      setMessage({
        type: "error",
        text: "Invalid file type. Please select a .zip file.",
      });
      setFile(null);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0])
        handleFileChange(e.dataTransfer.files[0]);
    },
    [handleFileChange]
  );

  const handleFileUploadInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleUpload = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!jwtToken) {
      setMessage({
        type: "error",
        text: "Authentication token is missing. Please log in again.",
      });
      return;
    }

    if (!projectName || !file || !isFileSizeValid || !jwtToken) {
      setMessage({
        type: "error",
        text: "Project name and ZIP file are required.",
      });
      return;
    }

    setUploading(true);
    setMessage(null);
    setButtonText("Processing...");

    const formData = new FormData();
    formData.append("zip_file", file);
    formData.append("project_name", projectName);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setButtonText("Complete ✅");
        setMessage({
          type: "success",
          text: `Project '${result.project_name}' processed successfully. Extracted size: ${result.extracted_size_mb}.`,
        });
      } else {
        const errorMessage: string =
          result.detail || result.error || "An unknown server error occurred.";
        setButtonText("Upload Failed ❌");
        setMessage({
          type: "error",
          text: `Error (${response.status}): ${errorMessage}`,
        });
      }
    } catch (error) {
      setButtonText("Connection Error ❌");
      setMessage({
        type: "error",
        text: `Network error: Could not connect to the server.`,
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontFamily: "Roboto, sans-serif",
        p: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleUpload}
        sx={{
          flex: 1,
          maxWidth: 600,
          minWidth: 300,
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
          p: { xs: 2, md: 4 },
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: "white", fontWeight: 700, mb: 4, textAlign: "center" }}
        >
          Secured Project Upload
        </Typography>

        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 3, borderRadius: "0.75rem" }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Project Name"
          variant="outlined"
          value={projectName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setProjectName(e.target.value)
          }
          required
          sx={{ mb: 3, ...textFieldStyle }}
        />

        {/* JWT Token is assumed to be loaded from Redux/Context state and is NOT visible here. */}
        {/* If the placeholder is empty, show a warning, but don't require user input */}
        {!jwtToken && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Authentication token is missing. Please ensure your are authorised
          </Alert>
        )}

        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload-input")?.click()}
          sx={{
            border: `2px dashed ${dragActive ? "#FF00FF" : "#00FFFF"}`,
            borderRadius: "1rem",
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: dragActive
              ? "rgba(0,255,255,0.1)"
              : "rgba(255,255,255,0.05)",
            transition: "all 0.3s",
            mb: 3,
          }}
        >
          <input
            type="file"
            id="file-upload-input"
            accept=".zip"
            onChange={handleFileUploadInput}
            style={{ display: "none" }}
          />
          {!file ? (
            <FileUploadIcon
              sx={{ fontSize: 40, color: dragActive ? "#FF00FF" : "#00FFFF" }}
            />
          ) : (
            <FolderZipIcon
              sx={{
                fontSize: 40,
                color: !isFileSizeValid ? "#ff0000ff" : "#00FFFF",
              }}
            />
          )}
          <Typography sx={{ color: "white", mt: 1, fontWeight: 500 }}>
            {file
              ? file.name
              : "Drag and drop a ZIP folder here, or click to browse."}
          </Typography>
          <Typography variant="caption" sx={{ color: "gray.400" }}>
            Accepted format: .zip (Max {MAX_UPLOAD_SIZE_MB} MB)
          </Typography>
        </Box>

        {file && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: "0.5rem",
              border: `1px solid ${isFileSizeValid ? "#4ade80" : "#f87171"}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "white" }}>
              File Size: **{formatBytes(file.size)}**
            </Typography>
            {!isFileSizeValid && (
              <Typography variant="caption" color="error">
                File exceeds the maximum limit of {MAX_UPLOAD_SIZE_MB} MB!
              </Typography>
            )}
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => setFile(null)}
              size="small"
              sx={{ mt: 1, color: "#f87171" }}
            >
              Remove File
            </Button>
          </Box>
        )}

        <Button
          fullWidth
          type="submit"
          variant="contained"
          // Disabled if missing project name, file, invalid size, or no JWT token
          disabled={
            !projectName || !file || !isFileSizeValid || uploading || !jwtToken
          }
          sx={{
            bgcolor: "#05b2b2ff",
            color: "black",
            fontWeight: 700,
            borderRadius: "1rem",
            py: 1.5,
            position: "relative",
            overflow: "hidden",
            "&:hover": { bgcolor: "#00FFFF" },
            "&.Mui-disabled": { bgcolor: "gray.700", color: "gray.400" },
          }}
        >
          {uploading ? "Uploading..." : buttonText}
        </Button>
        {uploading && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              mt: 1,
              borderRadius: "0.5rem",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
