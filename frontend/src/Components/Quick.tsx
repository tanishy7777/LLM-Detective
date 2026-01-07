import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  TextField,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/system";

// --- CONSTANTS FOR BACKEND LOGIC ---
const MAX_CHUNKS = 150;
const TOTAL_PAGES = 5;

// --- TYPE DEFINITIONS ---
type ColorKey = 0 | 1 | 2 | 3 | 4;

interface BackendChunkData {
  input: string;
  result: ColorKey;
}

interface IncomingChunkMessage {
  page: number;
  chunk: number;
  data: BackendChunkData;
  text: string;
}

interface Chunk {
  text: string;
  colorKey: ColorKey;
}

interface PageResult {
  page: number;
  content: Chunk[];
}

interface ChunkCounts {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  total: number;
}

// --- COSMIC AESTHETIC CONSTANTS ---

// Primary Accent Color (Vibrant Magenta/Pink)
const ACCENT_COLOR_PRIMARY = "#FF00FF";
// Secondary Accent Color (Cool Cyan/Light Blue for highlights)
const ACCENT_COLOR_SECONDARY = "#00FFFF";
// Muted Text Color
const TEXT_COLOR_MUTED = "rgba(255, 255, 255, 0.8)";


// Color mapping for AI detection categories (Kept as is, as they are classification-specific)
const colorMap: Record<ColorKey, string> = {
  0: "#ff4d4d", // AI (Red)
  1: "#ffa64d", // Humanised (Orange)
  2: "#33cc33", // Human (Green)
  3: "#4da6ff", // Polished (Blue)
  4: "#b366ff", // Cannot be determined (Purple)
};

// Styles for the main 'Crystal Shard' glassmorphic effect
const crystalShardStyle = {
  backdropFilter: "blur(30px) saturate(180%)",
  background: "rgba(30, 30, 30, 0.7)", // Slightly brighter and more prominent dark glass
  border: "1px solid rgba(255,255,255,0.15)", // Finer white border
  borderRadius: "2rem",
  boxShadow:
    "0 10px 40px 0 rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
  transition: "all 0.3s ease-in-out",
};

const initialChunkCounts: ChunkCounts = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  total: 0,
};

// Styled component for the result pages - "Data Console Output"
const PageBox = styled(Box)(() => ({
  margin: "25px 0",
  padding: "30px", // Larger padding for a cleaner look
  borderRadius: "1.5rem",
  background: "rgba(40, 40, 40, 0.7)", // Darker, less blurred background for content
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  lineHeight: 1.8,
  position: "relative",
  fontFamily: '"Consolas", "Courier New", monospace', // Monospace font for data
  fontSize: "0.95rem",
  transition: "box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: `0 0 20px ${ACCENT_COLOR_PRIMARY}20`, // Subtle magenta glow on hover
  },
}));

// --- AI Detection Dashboard Component ---

export default function AIDetectionDashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Select a PDF file to begin.");
  const [results, setResults] = useState<PageResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [totalPages, setTotalPages] = useState(TOTAL_PAGES);

  // New state for pagination and progress
  const [currentPage, setCurrentPage] = useState(1);
  const [scanProgress, setScanProgress] = useState(0);
  const [jumpInput, setJumpInput] = useState<string>("");


  // State to track counts for percentage calculation
  const [chunkCounts, setChunkCounts] =
    useState<ChunkCounts>(initialChunkCounts);

  // Calculate percentages for the legend dynamically
  const percentages = useMemo<Record<ColorKey, string>>(() => {
    if (chunkCounts.total === 0) {
      return { 0: "0.0", 1: "0.0", 2: "0.0", 3: "0.0", 4: "0.0" };
    }
    return Object.keys(colorMap).reduce(
      (acc, key) => {
        const k = parseInt(key) as ColorKey;
        acc[k] = ((chunkCounts[k] / chunkCounts.total) * 100).toFixed(1);
        return acc;
      },
      {} as Record<ColorKey, string>
    );
  }, [chunkCounts]);

  // Filter results to show only the current page
  const filteredResults = useMemo(() => {
    return results.filter((r) => r.page === currentPage);
  }, [results, currentPage]);

  // --- Pagination Handlers ---

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleJumpToPage = useCallback(() => {
    const pageNumber = parseInt(jumpInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setStatus(`Jumped to Page ${pageNumber}.`);
    } else {
      setStatus(`Error: Page number must be between 1 and ${totalPages}.`);
    }
  }, [jumpInput, totalPages]);

  // --- File Handling Logic ---

  const handleFileChange = useCallback((file: File) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setStatus(`Selected file: ${file.name}`);
    } else {
      console.error("Invalid file type. Please select a PDF.");
      setSelectedFile(null);
      setStatus("Error: Invalid file type. Please select a PDF.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // --- OCR WebSocket Logic ---

  const handleStartOCR = useCallback(() => {
    if (!selectedFile) {
      setStatus("Error: Please select a PDF file first.");
      return;
    }

    setIsScanning(true);
    setStatus("Connecting to OCR WebSocket...");
    setResults([]);
    setChunkCounts(initialChunkCounts);
    setScanProgress(0);
    setCurrentPage(1);

    const ws = new WebSocket("ws://localhost:5000/ws/ocr/pdf");
    let totalChunksProcessed = 0;
    let maxPagesSeen = 0;

    ws.onopen = () => {
      setStatus(`Connected. Sending "${selectedFile.name}" to backend...`);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          ws.send(event.target.result);
        }
      };
      reader.onerror = () => {
        setStatus("Error reading file.");
        ws.close();
        setIsScanning(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    };

    ws.onmessage = (event) => {
      try {
        if (
          typeof event.data === "string" &&
          event.data.startsWith("Connected.")
        ) {
          setStatus(event.data);
          return;
        }

        

        const message = JSON.parse(event.data);
        if (message.hasOwnProperty("total pages")) {
          return
        }

        // 1. Handle completion message
        if (message.status === "done") {
          setStatus("OCR completed for all pages!");
          setIsScanning(false);
          setScanProgress(100);
          return;
        }

        // 2. Handle page completion message (Useful for tracking total pages)
        if (message.status === "completed") {
          maxPagesSeen = Math.max(maxPagesSeen, message.page);
          setTotalPages(maxPagesSeen);
          setStatus(`Page ${message.page} completed.`);
          return;
        }

        // 3. Handle chunk result or error
        if (message.error) {
          setStatus(
            `Error on page ${message.page}, chunk ${message.chunk}: ${message.error}`
          );
          return;
        }

        const chunkMessage: IncomingChunkMessage = message;
        const colorKey = chunkMessage.data.result;
        const chunkText = chunkMessage.text;

        totalChunksProcessed++;

        // --- State Updates ---

        setScanProgress(
          Math.min(100, (message.page / MAX_CHUNKS) * 100)
        );

        // Update counts
        setChunkCounts((prev) => ({
          ...prev,
          [colorKey]: prev[colorKey] + 1,
          total: prev.total + 1,
        }));

        // Add to results
        setResults((prev) => {
          let currentResults = [...prev];
          let pageIndex = currentResults.findIndex(
            (r) => r.page === chunkMessage.page
          );

          if (pageIndex === -1) {
            currentResults.push({ page: chunkMessage.page, content: [] });
            pageIndex = currentResults.length - 1;
            maxPagesSeen = Math.max(maxPagesSeen, chunkMessage.page);
            setTotalPages(maxPagesSeen);
          }

          currentResults[pageIndex].content.push({
            text: chunkText,
            colorKey: colorKey,
          });

          return currentResults;
        });

        // Set status to reflect current chunk being processed
        setStatus(
          `Processing Page ${chunkMessage.page}, Chunk ${chunkMessage.chunk} (${totalChunksProcessed} chunks total)...`
        );
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        setStatus("Error receiving data from server.");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("WebSocket connection failed. Check server status.");
      setIsScanning(false);
    };

    ws.onclose = () => {
      console.log("WebSocket closed.");
      if (isScanning) {
        setStatus("Processing finished or connection closed by server.");
        setIsScanning(false);
        setScanProgress(100);
      }
    };

    // Clean up the WebSocket connection when the component unmounts or scan stops
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedFile, isScanning]);

  return (
    <Box
      sx={{
        // --- AESTHETIC OVERHAUL: Full Transparency & Cosmic Grid ---
        minHeight: "100vh",
        width: "100%",
        // 1. Transparent Background (The key for a full-screen glass effect)
        background: "transparent",
        // 2. Simulating a subtle cosmic/grid overlay for depth

        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        padding: { xs: 2, md: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >

      {/* --- Main Crystal Shard Container (Input & Controls) --- */}
      <Box
        sx={{
          ...crystalShardStyle,
          width: "100%",
          maxWidth: 900, // Slightly wider container
          p: { xs: 4, md: 6 },
          mb: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Drag and Drop Area - Sleeker Look */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload-input")?.click()}
          sx={{
            border: `2px dashed ${dragActive ? ACCENT_COLOR_PRIMARY : "rgba(255, 255, 255, 0.2)"}`,
            borderRadius: "15px",
            p: { xs: 5, md: 8 },
            width: "100%",
            textAlign: "center",
            cursor: "pointer",
            transition:
              "border 0.3s ease, background 0.3s ease, box-shadow 0.3s ease",
            backgroundColor: dragActive
              ? "rgba(255,0,255,0.1)"
              : "rgba(0, 0, 0, 0.2)",
            "&:hover": {
              border: `2px dashed ${ACCENT_COLOR_PRIMARY}`,
              boxShadow: `0 0 15px ${ACCENT_COLOR_PRIMARY}50`,
            },
          }}
        >
          <input
            type="file"
            id="file-upload-input"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            style={{ display: "none" }}
          />
          <Box id="file-placeholder">
            {selectedFile ? (
              <Box>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  fill={ACCENT_COLOR_PRIMARY} // Magenta file icon
                  viewBox="0 0 16 16"
                  style={{ display: "block", margin: "0 auto" }}
                >
                  <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3.5V1h4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                </svg>
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "20px",
                    mt: 2,
                    color: ACCENT_COLOR_PRIMARY,
                    fontWeight: 600,
                  }}
                >
                  {selectedFile.name.length > 20 
                    ? selectedFile.name.substring(0, 20) + "###." + selectedFile.name.split('.').pop()
                    : selectedFile.name
                  }
                </Typography>
                <Typography
                  sx={{ color: TEXT_COLOR_MUTED, fontSize: "14px", mt: 0.5 }}
                >
                  Ready for analysis. Click 'Start' below.
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon
                  sx={{ fontSize: 50, color: "rgba(255, 255, 255, 0.5)" }}
                />
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "20px",
                    mt: 2,
                    fontWeight: 500,
                  }}
                >
                  Drag & Drop PDF File
                </Typography>
                <Typography
                  sx={{
                    display: "block",
                    fontSize: "14px",
                    color: TEXT_COLOR_MUTED,
                  }}
                >
                  or Click to Open File Browser
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Start Button - Vibrant Magenta */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            id="startBtn"
            onClick={handleStartOCR}
            disabled={!selectedFile || isScanning}
            variant="contained"
            sx={{
              background: isScanning
                ? ACCENT_COLOR_SECONDARY
                : ACCENT_COLOR_PRIMARY,
              border: "none",
              padding: "12px 40px",
              borderRadius: "15px",
              color: "black",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: `0 0 15px ${ACCENT_COLOR_PRIMARY}80`,
              "&:hover": {
                background: isScanning
                  ? ACCENT_COLOR_SECONDARY
                  : ACCENT_COLOR_PRIMARY,
                boxShadow: isScanning
                  ? `0 0 20px ${ACCENT_COLOR_SECONDARY}FF`
                  : `0 0 25px ${ACCENT_COLOR_PRIMARY}FF`,
                transform: "translateY(-2px)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.5)",
                boxShadow: "none",
              },
            }}
          >
            {isScanning ? "SCANNING DATA STREAM..." : "ACTIVATE ANALYSIS"}
          </Button>

          {/* Stop Button - Red/Orange */}
          {isScanning && (
            <Button
              id="stopBtn"
              onClick={() => {}}
              variant="contained"
              sx={{
                background: "#ff4d4d",
                border: "none",
                padding: "12px 40px",
                borderRadius: "15px",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 0 15px #ff4d4d80",
                "&:hover": {
                  background: "#ff3333",
                  boxShadow: "0 0 25px #ff3333FF",
                  transform: "translateY(-2px)",
                },
              }}
            >
              STOP ANALYSIS
            </Button>
          )}
        </Box>

        {/* --- Status, Progress, and Results Container --- */}
        <Box sx={{ mt: 5, width: "100%" }}>
          {/* Status & Progress */}
          <Typography
            component="p"
            sx={{
              margin: "10px 0",
              color: isScanning ? ACCENT_COLOR_SECONDARY : TEXT_COLOR_MUTED,
              fontWeight: 500,
            }}
          >
            SYSTEM STATUS: {status}
          </Typography>

          {(isScanning || chunkCounts.total > 0) && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={scanProgress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: ACCENT_COLOR_PRIMARY, // Progress bar is Magenta
                    transition: "transform 0.4s linear",
                    boxShadow: `0 0 8px ${ACCENT_COLOR_PRIMARY}80`,
                  },
                }}
              />
              <Typography
                variant="body2"
                color={ACCENT_COLOR_PRIMARY}
                sx={{ mt: 1, textAlign: "right", fontWeight: 700 }}
              >
                DATA STREAM {scanProgress.toFixed(1)}% COMPLETE
              </Typography>
            </Box>
          )}

          {/* Render Filtered Page Result */}
          {filteredResults.map((pageData, pageIndex) => (
            <PageBox key={pageIndex} sx={{height: '50vh', overflowX: 'auto'}}>
              <Typography
                component="strong"
                sx={{
                  color: ACCENT_COLOR_SECONDARY,
                  mb: 2,
                  fontSize: "1.4rem",
                  display: "block",
                  borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
                }}
              >
                [ PAGE {pageData.page} / {totalPages} ]
              </Typography>
              <Box component="p" sx={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {pageData.content.map((chunk, chunkIndex) => (
                  <Tooltip
                    key={chunkIndex}
                    title={
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                      >
                        {`CLASSIFICATION: ${colorKeyToName(chunk.colorKey)}`}
                      </Typography>
                    }
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: colorMap[chunk.colorKey] || "#fff",
                          color: chunk.colorKey === 2 ? "black" : "white", // Ensure contrast
                          borderRadius: "8px",
                          padding: "8px 12px",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                          backdropFilter: "blur(5px)",
                        },
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        textDecoration: `underline solid ${colorMap[chunk.colorKey] || "#fff"}`,
                        textDecorationThickness: "2.5px", // Slightly thicker underline
                        textUnderlineOffset: "4px",
                        marginRight: "4px",
                        color: TEXT_COLOR_MUTED, // Muted color for the text itself
                        transition: "color 0.2s ease",
                        textDecorationColor: colorMap[chunk.colorKey] || "#fff",
                        cursor: "help",
                        "&:hover": {
                          color: colorMap[chunk.colorKey], // Text color highlights on hover
                        },
                      }}
                    >
                      {chunk.text}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </PageBox>
          ))}

          {/* --- Pagination Controls --- */}
          {results.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outlined"
                sx={{
                  color: ACCENT_COLOR_SECONDARY,
                  borderColor: ACCENT_COLOR_SECONDARY,
                  borderRadius: "10px",
                  "&:hover": {
                    borderColor: ACCENT_COLOR_PRIMARY,
                    color: ACCENT_COLOR_PRIMARY,
                    boxShadow: `0 0 10px ${ACCENT_COLOR_PRIMARY}40`,
                  },
                }}
              >
                {"< PREV"}
              </Button>

              <Typography
                color="white"
                fontWeight={600}
                sx={{ mx: 2, fontSize: "1.1rem" }}
              >
                PAGE {currentPage} / {totalPages}
              </Typography>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outlined"
                sx={{
                  color: ACCENT_COLOR_SECONDARY,
                  borderColor: ACCENT_COLOR_SECONDARY,
                  borderRadius: "10px",
                  "&:hover": {
                    borderColor: ACCENT_COLOR_PRIMARY,
                    color: ACCENT_COLOR_PRIMARY,
                    boxShadow: `0 0 10px ${ACCENT_COLOR_PRIMARY}40`,
                  },
                }}
              >
                {"NEXT >"}
              </Button>

              <TextField
                label="Jump to"
                variant="outlined"
                size="small"
                type="number"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                InputLabelProps={{ sx: { color: "rgba(255, 255, 255, 0.7)" } }}
                inputProps={{
                  min: 1,
                  max: totalPages,
                  sx: { color: "white" },
                }}
                sx={{
                  maxWidth: 100,
                  ml: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.4)" },
                    "&:hover fieldset": { borderColor: ACCENT_COLOR_SECONDARY },
                    "&.Mui-focused fieldset": {
                      borderColor: ACCENT_COLOR_PRIMARY,
                      boxShadow: `0 0 5px ${ACCENT_COLOR_PRIMARY}40`,
                    },
                  },
                }}
              />
              <Button
                onClick={handleJumpToPage}
                variant="contained"
                sx={{
                  background: ACCENT_COLOR_PRIMARY,
                  color: "black",
                  fontWeight: 700,
                  borderRadius: "10px",
                  "&:hover": {
                    background: ACCENT_COLOR_SECONDARY,
                    boxShadow: `0 0 10px ${ACCENT_COLOR_SECONDARY}FF`,
                  },
                }}
              >
                GO
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* --- Legend Panel (Modified for 'Crystal Shard' aesthetic) --- */}
      <Box
        id="legend"
        sx={{
          ...crystalShardStyle,
          position: "fixed",
          top: { xs: "auto", sm: "150px" },
          bottom: { xs: "20px", sm: "auto" },
          right: "20px",
          width: "220px", // Slightly wider legend
          p: 3,
          zIndex: 10,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: "18px",
            mb: 2,
            textAlign: "center",
            fontWeight: 700,
            color: ACCENT_COLOR_SECONDARY,
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          ANALYSIS LEGEND
        </Typography>

        {Object.entries(colorMap).map(([key, color]) => {
          const colorKey = parseInt(key) as ColorKey;
          const name = colorKeyToName(colorKey);
          return (
            <Box
              key={key}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                fontSize: "15px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minWidth: "120px",
                  flexGrow: 1,
                }}
              >
                <span
                  className="color-box"
                  style={{
                    background: color,
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    marginRight: "10px",
                    boxShadow: `0 0 5px ${color}80`,
                  }}
                ></span>
                <Typography
                  component="span"
                  sx={{ color: TEXT_COLOR_MUTED, fontWeight: 500 }}
                >
                  {name}
                </Typography>
              </Box>
              <Typography
                component="span"
                sx={{
                  color: color,
                  fontWeight: 800,
                  minWidth: "40px",
                  textAlign: "right",
                }}
                id={`perc${key}`}
              >
                {percentages[colorKey]}%
              </Typography>
            </Box>
          );
        })}
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            pt: 1,
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
            textAlign: "center",
            color: TEXT_COLOR_MUTED,
          }}
        >
          Total Chunks: {chunkCounts.total}
        </Typography>
      </Box>
    </Box>
  );
}

// Helper function to map ColorKey to a readable name
function colorKeyToName(key: ColorKey): string {
  switch (key) {
    case 0:
      return "AI";
    case 1:
      return "Humanised";
    case 2:
      return "Human";
    case 3:
      return "Polished";
    case 4:
      return "Undetermined";
    default:
      return "Unknown";
  }
}
