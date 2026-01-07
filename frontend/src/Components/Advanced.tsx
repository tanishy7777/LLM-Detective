import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  // Removed unused import { styled } from "@mui/system";
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

// --- TYPE DEFINITIONS & CONSTANTS ---
type ColorKey = 0 | 1 | 2 | 3 | 4;
type ModelKey = 0 | 1 | 2 | 3;
type RawChunk = [string, ColorKey, ModelKey];

interface ChunkCounts {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  total: number; // Total weighted characters
}

// COSMIC AESTHETIC CONSTANTS
const ACCENT_COLOR_PRIMARY = "#FF00FF"; // Vibrant Magenta/Pink
const ACCENT_COLOR_SECONDARY = "#00FFFF"; // Cool Cyan/Light Blue
const TEXT_COLOR_MUTED = "rgba(255, 255, 255, 0.7)";
const PANEL_WIDTH = 380;
const API_ENDPOINT = "http://localhost:5000/api/pdf/actual";

// CONVERTED: Color map using hex codes derived from the user's requested RGB tuples
const colorMap: Record<ColorKey, string> = {
  0: "#99FF99", // (1.0, 0.6, 0.6) - Light Green - Humanise
  1: "#9999FF", // (0.6, 1.0, 0.6) - Light Blue - Polished
  2: "#FF9999", // (0.6, 0.6, 1.0) - Light Red - AI
  3: "#FFFF99", // (1.0, 1.0, 0.6) - Light Yellow - Humanised
  4: "#fff", // (1.0, 0.8, 0.6) - Light Orange - Undetermined
};
// Helper function to map ColorKey to a readable name
function colorKeyToName(key: ColorKey): string {
  switch (key) {
    case 0:
      return "Human";
    case 1:
      return "Machine Polished";
    case 2:
      return "AI Generated";
    case 3:
      return "Machine Humanised";
    case 4:
      return "Undetermined";
    default:
      return "Unknown";
  }
}

// Styled Glass Shard Effect - Used for the main input panel and results panel
const crystalShardStyle = {
  backdropFilter: "blur(40px) saturate(200%)",
  background: "rgba(15, 15, 25, 0.75)", // Darker, space-like glass background
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "1.5rem",
  boxShadow: `0 0 50px 0 ${ACCENT_COLOR_PRIMARY}30, 0 10px 80px 0 rgba(0,0,0,0.8), inset 0 0 15px 1px rgba(255,255,255,0.05)`,
  transition: "all 0.4s ease-in-out",
};

// Styled Drop Zone - Enhanced for extreme beauty and dynamic feedback
const dropZoneStyle = (dragActive: boolean, selected: boolean) => ({
  border: `3px dashed ${dragActive ? ACCENT_COLOR_SECONDARY : selected ? ACCENT_COLOR_PRIMARY : "rgba(255, 255, 255, 0.2)"}`,
  borderRadius: "20px",
  p: { xs: 6, md: 10 },
  width: "100%",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.4s ease",
  // Inner glass effect for the drop zone
  backdropFilter: "blur(10px)",
  background: dragActive
    ? `rgba(0, 255, 255, 0.05)`
    : "rgba(255, 255, 255, 0.03)",
  // Subtle neon glow on hover/active states
  boxShadow: dragActive
    ? `0 0 30px ${ACCENT_COLOR_SECONDARY}AA`
    : selected
      ? `0 0 15px ${ACCENT_COLOR_PRIMARY}50`
      : "none",
  "&:hover": {
    border: `3px dashed ${ACCENT_COLOR_SECONDARY}`,
    boxShadow: `0 0 30px ${ACCENT_COLOR_SECONDARY}50`,
  },
});

const initialChunkCounts: ChunkCounts = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  total: 0,
};

// --- Advanced Component ---

export default function Advanced() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Awaiting PDF for analysis.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [modelKeys, setModelKeys] = useState<
    Record<ColorKey, Record<ModelKey, number>>
  >({
    0: { 0: 0, 1: 0, 2: 0, 3: 0 },
    1: { 0: 0, 1: 0, 2: 0, 3: 0 },
    2: { 0: 0, 1: 0, 2: 0, 3: 0 },
    3: { 0: 0, 1: 0, 2: 0, 3: 0 },
    4: { 0: 0, 1: 0, 2: 0, 3: 0 },
  });

  const modelKeyNames: Record<ModelKey, string> = {
    0: "LLama",
    1: "Mistal",
    2: "Aya",
    3: "Falcon",
  };
  const getMaxModelKeyName = (colorKey: ColorKey): string => {
    const models = modelKeys[colorKey];
    const modelKey = Number(
      Object.entries(models).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    ) as ModelKey;
    return modelKeyNames[modelKey];
  };
  // API Results
  const [processedPdfBase64, setProcessedPdfBase64] = useState<string | null>(
    null
  );
  const [chunkCounts, setChunkCounts] =
    useState<ChunkCounts>(initialChunkCounts);

  // Chart data and percentage calculation
  const { chartData, percentageData } = useMemo(() => {
    const counts = chunkCounts;
    const total = counts.total;
    const keys = Object.keys(colorMap) as unknown as (keyof typeof colorMap)[];

    const labels = keys.map((keyStr) =>
      colorKeyToName(parseInt(keyStr.toString(), 10) as ColorKey)
    );
    const dataValues = keys.map(
      (key) => counts[parseInt(key.toString(), 10) as ColorKey]
    );
    const backgroundColors = Object.values(colorMap);

    const chartData = {
      labels: labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
        },
      ],
    };

    const percentageData: Record<ColorKey, string> = keys.reduce(
      (acc, keyStr) => {
        const key = parseInt(keyStr.toString(), 10) as ColorKey;
        acc[key] = (total === 0 ? 0.0 : (counts[key] / total) * 100).toFixed(1);
        return acc;
      },
      {} as Record<ColorKey, string>
    );

    return { chartData, percentageData };
  }, [chunkCounts]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Classification Distribution",
        color: ACCENT_COLOR_SECONDARY,
        font: { size: 18, weight: "700", family: '"Poppins", sans-serif' },
        padding: { top: 0, bottom: 15 },
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        titleColor: ACCENT_COLOR_PRIMARY,
        bodyColor: TEXT_COLOR_MUTED,
        borderColor: ACCENT_COLOR_SECONDARY,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${label}: ${value.toLocaleString()} (Weight) | ${percentage}%`;
          },
        },
      },
    },
  };

  // --- File Handling and API Logic (remains the same) ---
  const handleFileChange = useCallback((file: File) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setStatus(`Selected: ${file.name}. Ready for analysis.`);
      setProcessedPdfBase64(null);
      setChunkCounts(initialChunkCounts);
    } else {
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

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessedPdfBase64(null);
    setChunkCounts(initialChunkCounts);
    setStatus(
      `Uploading and analyzing "${selectedFile.name}" via ${API_ENDPOINT}...`
    );
    setIsChartOpen(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ msg: response.statusText }));
        throw new Error(
          `API Error ${response.status}: ${errorData.msg || response.statusText}`
        );
      }

      const result = await response.json();
      const { pdf_bytes, data } = result;

      if (!pdf_bytes || !Array.isArray(data)) {
        throw new Error(
          "Invalid response structure from API. Missing 'pdf_bytes' or 'data'."
        );
      }

      // Process Classification Data (Weighted by text length)
      let counts: ChunkCounts = { ...initialChunkCounts };
      for (const item of data as RawChunk[]) {
        const [text, classKey, _] = item;
        const weight = text.length;
        if (classKey in colorMap) {
          counts[classKey as ColorKey] += weight;
          counts.total += weight;
        }
      }

      let newModelKeys: Record<ColorKey, Record<ModelKey, number>> = {
        ...modelKeys,
      };
      for (const item of data as RawChunk[]) {
        const [text, classKey, modelKey] = item;
        const weight = text.length;

        if (classKey in colorMap) {
          if (classKey === 0 || classKey === 4) continue; // Skip Human and Undetermined
          newModelKeys[classKey as ColorKey][modelKey] += weight;
          counts.total += weight;
        }
      }
      setModelKeys(newModelKeys);
      console.log(newModelKeys);

      // Set Results
      setProcessedPdfBase64(pdf_bytes);
      setChunkCounts(counts);
      setStatus(
        result.message || `Analysis complete. Document: ${selectedFile.name}`
      );
    } catch (error) {
      console.error("Analysis Failed:", error);
      setStatus(
        `Analysis Failed: ${error instanceof Error ? error.message : "Network error"}. Check console and API server.`
      );
      setProcessedPdfBase64(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile]);

  // --- Render Functions ---

  const renderInputShard = () => (
    // Main background container (Transparent to show body background)
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        backgroundColor: "transparent", // Ensure transparency for the dramatic effect
        m: "auto",
      }}
    >
      {/* Input Shard Panel (Glassmorphism effect) */}
      <Box
        sx={{
          ...crystalShardStyle,
          width: "100%",
          maxWidth: 800,
          p: { xs: 4, md: 8 },
          m: "auto",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Drag and Drop Area (Enhanced Glassmorphism) */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload-input")?.click()}
          sx={dropZoneStyle(dragActive, !!selectedFile)}
          margin={"auto"}
        >
          <input
            type="file"
            id="file-upload-input"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
            style={{ display: "none" }}
          />
          <Box>
            <CloudUploadIcon
              sx={{
                fontSize: 80,
                color: selectedFile
                  ? ACCENT_COLOR_PRIMARY
                  : ACCENT_COLOR_SECONDARY,
                mb: 2,
                // Iconic neon glow
                textShadow: `0 0 10px ${ACCENT_COLOR_SECONDARY}, 0 0 20px ${ACCENT_COLOR_SECONDARY}80`,
              }}
            />
            <Typography
              sx={{
                fontSize: "28px",
                mt: 1,
                fontWeight: 700,
                color: selectedFile
                  ? ACCENT_COLOR_PRIMARY
                  : ACCENT_COLOR_SECONDARY,
              }}
            >
              {selectedFile
                ? `File Selected: ${selectedFile.name}`
                : "DRAG & DROP PDF OR CLICK"}
            </Typography>
            <Typography
              sx={{
                fontSize: "18px",
                color: TEXT_COLOR_MUTED,
                mt: 0.5,
                letterSpacing: 1,
              }}
            >
              {selectedFile
                ? "INITIATE ANALYSIS SEQUENCE BELOW."
                : "PDF Data Upload (Max 10MB)"}
            </Typography>
          </Box>
        </Box>

        {/* Start Button (Hyper-accented) */}
        <Button
          onClick={handleStartAnalysis}
          disabled={!selectedFile || isProcessing}
          variant="contained"
          sx={{
            mt: 5,
            background: ACCENT_COLOR_PRIMARY,
            padding: "18px 60px",
            borderRadius: "10px",
            color: "black",
            fontWeight: 900,
            minWidth: 320,
            fontSize: "1.1rem",
            // Extreme neon button glow
            boxShadow: `0 0 30px ${ACCENT_COLOR_PRIMARY}FF, 0 0 60px ${ACCENT_COLOR_PRIMARY}60`,
            "&:hover": {
              background: ACCENT_COLOR_SECONDARY,
              boxShadow: `0 0 40px ${ACCENT_COLOR_SECONDARY}FF, 0 0 80px ${ACCENT_COLOR_SECONDARY}60`,
              transform: "scale(1.02)",
            },
            "&:disabled": {
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.5)",
              boxShadow: "none",
            },
          }}
        >
          {isProcessing ? (
            <CircularProgress size={24} sx={{ color: "black" }} />
          ) : (
            "ACTIVATE ANALYSIS SEQUENCE"
          )}
        </Button>

        {/* Status & Progress Bar (Holographic Status) */}
        <Box
          sx={{
            mt: 5,
            width: "100%",
            maxWidth: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            component="p"
            sx={{
              color: isProcessing ? ACCENT_COLOR_SECONDARY : TEXT_COLOR_MUTED,
              fontWeight: 600,
              textAlign: "center",
              mb: 1,
            }}
          >
            SYSTEM LOG: {status}
          </Typography>
          {isProcessing && (
            <LinearProgress
              sx={{
                height: 12,
                borderRadius: 6,
                width: "100%",
                mt: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: ACCENT_COLOR_PRIMARY,
                  boxShadow: `0 0 10px ${ACCENT_COLOR_PRIMARY}FF`,
                },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderResultsView = () => (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        position: "relative",
      }}
    >
      {/* --- Main Content Area: PDF Viewer --- */}
      <Box
        sx={{
          flexGrow: 1,
          height: "100vh",
          padding: "30px",
          paddingRight: isChartOpen ? `${PANEL_WIDTH + 30}px` : "30px",
          transition: "padding-right 0.3s ease",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: ACCENT_COLOR_SECONDARY,
            fontWeight: 800,
            mb: 2,
            textShadow: `0 0 8px ${ACCENT_COLOR_SECONDARY}50`,
          }}
        >
          {selectedFile?.name || "Document Analysis"}
        </Typography>

        <Box
          component="iframe"
          id="pdfViewer"
          title="Processed PDF"
          // Applied glass background to the PDF viewer container
          sx={{
            width: "100%",
            height: "80vh",
            borderRadius: "1rem",
            border: `2px solid ${ACCENT_COLOR_PRIMARY}60`,
            backdropFilter: "blur(5px)",
            backgroundColor: "rgba(40, 40, 60, 0.5)",
            boxShadow: `0 0 30px ${ACCENT_COLOR_PRIMARY}30`,
          }}
          src={
            processedPdfBase64
              ? `data:application/pdf;base64,${processedPdfBase64}`
              : ""
          }
        />

        {/* Status Bar for Results */}
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: TEXT_COLOR_MUTED,
            textAlign: "right",
            p: 1,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          SYSTEM STATUS: {status}
        </Typography>
      </Box>

      {/* --- Collapsible Analysis Panel (Glass Shard) --- */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: PANEL_WIDTH,
          transform: `translateX(${isChartOpen ? 0 : PANEL_WIDTH - 50}px)`,
          transition: "transform 0.3s ease-in-out",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {/* Toggle Button */}
        <Tooltip
          title={isChartOpen ? "Collapse Panel" : "Expand Panel"}
          placement="left"
        >
          <IconButton
            onClick={() => setIsChartOpen((prev) => !prev)}
            sx={{
              position: "absolute",
              top: "50%",
              left: -50,
              transform: "translateY(-50%)",
              bgcolor: "rgba(30, 30, 30, 0.8)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: `0 0 10px ${ACCENT_COLOR_PRIMARY}80`,
              color: ACCENT_COLOR_PRIMARY,
              "&:hover": {
                bgcolor: "rgba(50, 50, 50, 0.9)",
                color: ACCENT_COLOR_SECONDARY,
              },
            }}
          >
            {isChartOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>

        {/* Panel Content (Glass Shard) */}
        <Box
          sx={{
            ...crystalShardStyle,
            flexGrow: 1,
            p: 4,
            borderRadius: 0,
            borderLeft: "none",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: ACCENT_COLOR_PRIMARY,
              fontWeight: 700,
              mb: 3,
              textAlign: "center",
            }}
          >
            ANALYSIS OVERVIEW
          </Typography>

          <Tooltip
            title="Metric: Paragraph Length in Characters"
            placement="top"
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: ACCENT_COLOR_SECONDARY,
                textAlign: "center",
                mb: 3,
                p: 1,
                border: "1px solid rgba(0, 255, 255, 0.2)",
                borderRadius: "8px",
                // Subtle holographic data border
                boxShadow: `0 0 10px ${ACCENT_COLOR_SECONDARY}40`,
              }}
            >
              Total Weighted Chars: {chunkCounts.total.toLocaleString()}
            </Typography>
          </Tooltip>

          {/* Pie Chart Area */}
          <Box sx={{ height: 240, mb: 4, position: "relative" }}>
            {chunkCounts.total > 0 ? (
              //@ts-expect-error
              <Pie data={chartData} options={chartOptions} />
            ) : (
              <Typography
                color={TEXT_COLOR_MUTED}
                sx={{ textAlign: "center", mt: 10 }}
              >
                Awaiting data transmission...
              </Typography>
            )}
          </Box>

          {/* Custom Legend/Detailed Data */}
          <Typography
            variant="body1"
            sx={{
              color: TEXT_COLOR_MUTED,
              fontWeight: 700,
              mb: 2,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              pb: 1,
            }}
          >
            Classification Breakdown (Count & %):
          </Typography>

          {/* Legend Items */}
          <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
            {(
              Object.keys(colorMap) as unknown as (keyof typeof colorMap)[]
            ).map((keyStr) => {
              const key = parseInt(keyStr.toString(), 10) as ColorKey;
              const color = colorMap[key];
              const name = colorKeyToName(key);
              const value = chunkCounts[key];

              return (
                <Box sx={{ mb: 1.5 }} key={key}>
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "15px",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          background: color,
                          width: "16px",
                          height: "16px",
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
                      sx={{ color: color, fontWeight: 800, textAlign: "right" }}
                    >
                      {value.toLocaleString()} ({percentageData[key]}%)
                    </Typography>
                  </Box>
                  {name == "Machine Polished" ||
                  name == "AI Generated" ||
                  name == "Machine Humanised" ? (
                    <Typography
                      component="span"
                      sx={{
                        color: TEXT_COLOR_MUTED,
                        fontWeight: 500,
                        ml: 3.25,
                      }}
                    >
                      Detected Model: {getMaxModelKeyName(key)}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        // Set the primary container background to transparent
        backgroundColor: "transparent",
        // Assuming the parent or <body> element will provide the space background
        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* --- CONDITIONAL RENDERING: INPUT OR RESULTS --- */}
      {!processedPdfBase64 ? renderInputShard() : renderResultsView()}
    </Box>
  );
}
