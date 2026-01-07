import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TablePagination,
  Paper,
  Tooltip,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material";

// MUI Icons
import DescriptionIcon from "@mui/icons-material/Description";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import StraightenIcon from "@mui/icons-material/Straighten";
import SettingsIcon from "@mui/icons-material/Settings";

// Recharts for the visual analysis
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

// --- Type Definitions ---

interface ClassificationBreakdown {
  AI: number;
  Human: number;
  Humanized: number;
  Uncertain: number;
}

interface DocumentRow {
  id: string;
  name: string;
  classification: ClassificationBreakdown;
  plagiarismScore: number;
  status: "Pending" | "Scanned" | "Scanning" | "Failed";
}

interface ProjectData {
  id: string;
  name: string;
  sizeMB: number;
  plagiarismScore: number;
  documents: DocumentRow[];
}

interface ModelOption {
  value: string;
  label: string;
}

// --- Mock Data & Constants ---

const MOCK_PROJECT_DATA: ProjectData = {
  id: "IITGN-690db9d2a29c6e1666a99ff9",
  name: "Advanced Content Integrity Report Q4",
  sizeMB: 512.8,
  plagiarismScore: 18,
  documents: [
    {
      id: "DOC-001",
      name: "Introduction to CNNs",
      classification: { AI: 85, Human: 5, Humanized: 5, Uncertain: 5 },
      plagiarismScore: 5,
      status: "Scanned",
    },
    {
      id: "DOC-002",
      name: "Historical Review of LLMs",
      classification: { AI: 5, Human: 90, Humanized: 0, Uncertain: 5 },
      plagiarismScore: 2,
      status: "Scanned",
    },
    {
      id: "DOC-003",
      name: "Data Preprocessing Steps",
      classification: { AI: 30, Human: 40, Humanized: 20, Uncertain: 10 },
      plagiarismScore: 12,
      status: "Scanned",
    },
    {
      id: "DOC-004",
      name: "Results Summary and Conclusion",
      classification: { AI: 10, Human: 70, Humanized: 15, Uncertain: 5 },
      plagiarismScore: 7,
      status: "Scanned",
    },
    {
      id: "DOC-005",
      name: "Training Pipeline Documentation",
      classification: { AI: 45, Human: 45, Humanized: 5, Uncertain: 5 },
      plagiarismScore: 25,
      status: "Scanned",
    },
    {
      id: "DOC-006",
      name: "Client Onboarding Guide",
      classification: { AI: 1, Human: 94, Humanized: 0, Uncertain: 5 },
      plagiarismScore: 1,
      status: "Scanned",
    },
    {
      id: "DOC-010",
      name: "Q1 Initial Draft",
      classification: { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 },
      plagiarismScore: 0,
      status: "Pending",
    },
    {
      id: "DOC-011",
      name: "Q2 Final Report",
      classification: { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 },
      plagiarismScore: 0,
      status: "Pending",
    },
    {
      id: "DOC-008",
      name: "Client Proposal",
      classification: { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 },
      plagiarismScore: 15,
      status: "Scanning",
    },
    {
      id: "DOC-009",
      name: "Initial Brainstorming",
      classification: { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 },
      plagiarismScore: 0,
      status: "Failed",
    },
  ],
};

const AI_DETECTION_MODELS: ModelOption[] = [
  { value: "TinyBERT", label: "TinyBERT (Lightning Fast, Low Accuracy)" },
  { value: "BERT", label: "BERT (Balanced Performance)" },
  { value: "RoBERTa", label: "RoBERTa (High Accuracy, Slower)" },
];

const PLAGIARISM_MODELS: ModelOption[] = [
  { value: "ROUGE-2", label: "Word to Word Checking" },
  { value: "BERT", label: "BERT (Balanced Performance)" },
  { value: "TinyBERT", label: "TinyBERT (Lightning Fast, Low Accuracy)" },
];

const AI_BREAKDOWN_COLORS: Record<keyof ClassificationBreakdown, string> = {
  AI: "#9333EA",
  Human: "#10B981",
  Humanized: "#F59E0B",
  Uncertain: "#6366F1",
};

// --- Helper Functions ---

const calculateProjectAIBreakdown = (
  documents: DocumentRow[]
): ClassificationBreakdown => {
  const scannedDocs = documents.filter((d) => d.status === "Scanned");
  if (scannedDocs.length === 0)
    return { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 };

  const totals = scannedDocs.reduce(
    (acc, doc) => {
      acc.AI += doc.classification.AI;
      acc.Human += doc.classification.Human;
      acc.Humanized += doc.classification.Humanized;
      acc.Uncertain += doc.classification.Uncertain;
      return acc;
    },
    { AI: 0, Human: 0, Humanized: 0, Uncertain: 0 }
  );

  const count = scannedDocs.length;

  return {
    AI: parseFloat((totals.AI / count).toFixed(1)),
    Human: parseFloat((totals.Human / count).toFixed(1)),
    Humanized: parseFloat((totals.Humanized / count).toFixed(1)),
    Uncertain: parseFloat((totals.Uncertain / count).toFixed(1)),
  };
};

const getProjectPlagiarismData = (score: number, hasScannedDocs: boolean) => {
  if (!hasScannedDocs || score === 0) {
    return [{ name: "No Data", value: 100, color: "#6B7280" }];
  }
  return [
    { name: "Plagiarized", value: score, color: "#EF4444" },
    { name: "Original", value: 100 - score, color: "#10B981" },
  ];
};

const getProjectAIBreakdownPieData = (
  breakdown: ClassificationBreakdown,
  hasScannedDocs: boolean
) => {
  if (!hasScannedDocs) {
    return [{ name: "No Data", value: 100, color: "#6B7280" }];
  }

  const data = [
    {
      name: "AI Generated",
      value: breakdown.AI,
      color: AI_BREAKDOWN_COLORS.AI,
    },
    {
      name: "Human Written",
      value: breakdown.Human,
      color: AI_BREAKDOWN_COLORS.Human,
    },
    {
      name: "Humanized",
      value: breakdown.Humanized,
      color: AI_BREAKDOWN_COLORS.Humanized,
    },
    {
      name: "Uncertain",
      value: breakdown.Uncertain,
      color: AI_BREAKDOWN_COLORS.Uncertain,
    },
  ].filter((item) => item.value > 0);

  // If all values are 0, show "No Data"
  if (data.length === 0) {
    return [{ name: "No Data", value: 100, color: "#6B7280" }];
  }

  return data;
};

const CustomRechartsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backdropFilter: "blur(20px)",
          background: "rgba(17, 24, 39, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: data.color, fontWeight: 700, mb: 0.5 }}
        >
          {data.name}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
          {data.value}%
        </Typography>
      </Box>
    );
  }
  return null;
};

// --- Glass Card Component ---
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <Card
    className={className}
    sx={{
      backdropFilter: "blur(40px) saturate(180%)",
      background: "rgba(17, 24, 39, 0.7)",
      border: "1px solid rgba(255,255,255,0.125)",
      borderRadius: "24px",
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)",
      p: 3,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 48px 0 rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.2)",
      },
    }}
  >
    <CardContent
      sx={{ p: "0 !important", "&:last-child": { pb: "0 !important" } }}
    >
      {children}
    </CardContent>
  </Card>
);

// --- Document Breakdown Bar ---
const DocumentBreakdownBar: React.FC<{
  breakdown: ClassificationBreakdown;
}> = ({ breakdown }) => {
  const total =
    breakdown.AI + breakdown.Human + breakdown.Humanized + breakdown.Uncertain;
  const isScanned = total > 0;

  if (!isScanned) {
    return (
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
        Not Scanned
      </Typography>
    );
  }

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, mb: 1, display: "block" }}
          >
            Classification Breakdown
          </Typography>
          {Object.entries(breakdown).map(([key, value]) => (
            <Box
              key={key}
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="caption" sx={{ mr: 2 }}>
                {key}:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    AI_BREAKDOWN_COLORS[key as keyof ClassificationBreakdown],
                  fontWeight: 700,
                }}
              >
                {value}%
              </Typography>
            </Box>
          ))}
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        sx={{
          height: 8,
          borderRadius: "999px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "200px",
          cursor: "pointer",
          background: "rgba(255,255,255,0.1)",
          display: "flex",
        }}
      >
        {Object.entries(breakdown).map(
          ([key, value]) =>
            value > 0 && (
              <Box
                key={key}
                sx={{
                  width: `${value}%`,
                  backgroundColor:
                    AI_BREAKDOWN_COLORS[key as keyof ClassificationBreakdown],
                  transition: "all 0.3s ease",
                }}
              />
            )
        )}
      </Box>
    </Tooltip>
  );
};

// --- Main Component ---

const ProjectDetailsDashboard: React.FC = () => {
  const [projectId] = useState<string>(MOCK_PROJECT_DATA.id);
  const [projectData, setProjectData] =
    useState<ProjectData>(MOCK_PROJECT_DATA);
  const [aiModel, setAiModel] = useState<string>(AI_DETECTION_MODELS[0].value);
  const [plagiarismModel, setPlagiarismModel] = useState<string>(
    PLAGIARISM_MODELS[1].value
  );
  const [page, setPage] = useState<number>(0);
  const rowsPerPage: number = 5;

  const totalDocuments = projectData.documents.length;
  const scannedCount = projectData.documents.filter(
    (d) => d.status === "Scanned"
  ).length;

  const overallAIBreakdown = useMemo(
    () => calculateProjectAIBreakdown(projectData.documents),
    [projectData.documents]
  );

  const overallPlagiarismData = useMemo(() => {
    const hasScannedDocs = scannedCount > 0;
    return getProjectPlagiarismData(
      projectData.plagiarismScore,
      hasScannedDocs
    );
  }, [projectData.plagiarismScore, scannedCount]);

  const overallAIBreakdownData = useMemo(() => {
    const hasScannedDocs = scannedCount > 0;
    return getProjectAIBreakdownPieData(overallAIBreakdown, hasScannedDocs);
  }, [overallAIBreakdown, scannedCount]);

  //@ts-ignore
  const handleRefresh = () => {
    console.log(`Refreshing data for project ${projectId}...`);
    setProjectData({
      ...MOCK_PROJECT_DATA,
      name: "Advanced Content Integrity Report Q4 (Refreshed)",
    });
  };

  const handleViewReport = (documentName: string) => {
    console.log(`Navigating to detailed report for document: ${documentName}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 4,
        color: "white",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Stats and Config Card */}
      <Grid container spacing={3} sx={{ mb: 4, width: "100%" }}>
        {/* @ts-expect-error */}
        <Grid item size={12}>
          <GlassCard>
            <Grid container spacing={3}>
              {/* Project Info */}
              {/* @ts-expect-error */}
              <Grid item size={4}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                    }}
                  >
                    <AssignmentTurnedInIcon
                      sx={{ color: "white", fontSize: 24 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    >
                      Project ID
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        fontSize: "0.95rem",
                      }}
                    >
                      {projectData.id}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* @ts-expect-error */}
              <Grid item size={4}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                    }}
                  >
                    <AssignmentTurnedInIcon
                      sx={{ color: "white", fontSize: 24 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    >
                      Project Name
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        fontSize: "0.95rem",
                      }}
                    >
                      {projectData.name}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Size */}
              {/* @ts-expect-error */}
              <Grid item size={2}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                      borderRadius: "12px",
                      p: 1.5,
                      mb: 1,
                      display: "inline-flex",
                    }}
                  >
                    <StraightenIcon sx={{ color: "white", fontSize: 22 }} />
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        display: "block",
                        fontSize: "0.7rem",
                      }}
                    >
                      Total Size
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "white" }}
                    >
                      {projectData.sizeMB.toFixed(1)} MB
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Documents */}
              {/* @ts-expect-error */}
              <Grid item size={2}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
                      borderRadius: "12px",
                      p: 1.5,
                      mb: 1,
                      display: "inline-flex",
                    }}
                  >
                    <DescriptionIcon sx={{ color: "white", fontSize: 22 }} />
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        display: "block",
                        fontSize: "0.7rem",
                      }}
                    >
                      Documents
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "white" }}
                    >
                      {scannedCount}/{totalDocuments}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Plagiarism Risk */}

              {/* <Grid item size={4}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "white", fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        display: "block",
                        fontSize: "0.7rem",
                      }}
                    >
                      Average Plagiarism Risk
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: "white" }}
                    >
                      {projectData.plagiarismScore}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={projectData.plagiarismScore}
                  sx={{
                    height: 10,
                    borderRadius: "999px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background:
                        projectData.plagiarismScore > 25
                          ? "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)"
                          : "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                      borderRadius: "999px",
                    },
                  }}
                />
              </Grid> */}
            </Grid>

            {/* Model Configuration Section */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                mb: 4,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    borderRadius: "12px",
                    p: 1.5,
                    mr: 2,
                    display: "flex",
                  }}
                >
                  <SettingsIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  Model Configuration
                </Typography>
              </Box>

              <Grid
                container
                spacing={3}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                {/* @ts-expect-error */}
                <Grid item size={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                      AI Detection Model
                    </InputLabel>
                    <Select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value as string)}
                      label="AI Detection Model"
                      sx={{
                        color: "white",
                        borderRadius: "12px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(139, 92, 246, 0.5)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#8B5CF6",
                        },
                        "& .MuiSvgIcon-root": { color: "#8B5CF6" },
                      }}
                    >
                      {AI_DETECTION_MODELS.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          {model.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* @ts-expect-error */}
                <Grid item size={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Plagiarism Check Model
                    </InputLabel>
                    <Select
                      value={plagiarismModel}
                      onChange={(e) =>
                        setPlagiarismModel(e.target.value as string)
                      }
                      label="Plagiarism Check Model"
                      sx={{
                        color: "white",
                        borderRadius: "12px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(236, 72, 153, 0.5)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#EC4899",
                        },
                        "& .MuiSvgIcon-root": { color: "#EC4899" },
                      }}
                    >
                      {PLAGIARISM_MODELS.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          {model.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* @ts-expect-error */}
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<RocketLaunchIcon />}
                    onClick={() =>
                      console.log(
                        "Running analysis with models:",
                        aiModel,
                        plagiarismModel
                      )
                    }
                    sx={{
                      background:
                        "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "white",
                      borderRadius: "12px",
                      padding: "14px 32px",
                      fontWeight: 700,
                      fontSize: "1rem",
                      textTransform: "none",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.6)",
                        background:
                          "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Run Analysis
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* @ts-expect-error */}
        <Grid item size={6}>
          <GlassCard>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                textAlign: "center",
                color: "white",
              }}
            >
              Plagiarism Analysis
            </Typography>
            {scannedCount === 0 && (
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontStyle: "italic",
                }}
              >
                No scanned documents available
              </Typography>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={overallPlagiarismData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {overallPlagiarismData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomRechartsTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "14px", fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </Grid>

        {/* @ts-expect-error */}
        <Grid item size={6}>
          <GlassCard>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                textAlign: "center",
                color: "white",
              }}
            >
              AI Classification Distribution
            </Typography>
            {scannedCount === 0 && (
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontStyle: "italic",
                }}
              >
                No scanned documents available
              </Typography>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={overallAIBreakdownData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {overallAIBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomRechartsTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "14px", fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Documents Table */}
      <GlassCard>
        <Accordion
          defaultExpanded
          sx={{
            backgroundColor: "transparent",
            boxShadow: "none",
            "&:before": { display: "none" },
            color: "white",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#8B5CF6" }} />}
            sx={{ p: 0, mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: "white" }}>
              Document Analysis Overview ({totalDocuments} Total)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "16px",
                background: "rgba(17, 24, 39, 0.4)",
                backdropFilter: "blur(20px)",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Document Name",
                      "AI Classification",
                      "Plagiarism",
                      "Status",
                      "Actions",
                    ].map((head) => (
                      <TableCell
                        key={head}
                        align={head === "Document Name" ? "left" : "center"}
                        sx={{
                          color: "rgba(255,255,255,0.9)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          borderBottom: "2px solid rgba(139, 92, 246, 0.3)",
                          py: 2,
                        }}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectData.documents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doc) => {
                      const statusColorMap: Record<
                        DocumentRow["status"],
                        "success" | "info" | "error" | "default"
                      > = {
                        Scanned: "success",
                        Scanning: "info",
                        Failed: "error",
                        Pending: "default",
                      };
                      const isScanned = doc.status === "Scanned";

                      return (
                        <TableRow
                          key={doc.id}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(139, 92, 246, 0.1)",
                            },
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <TableCell
                            align="left"
                            sx={{
                              color: "white",
                              fontWeight: 600,
                              py: 2.5,
                            }}
                          >
                            {doc.name}
                          </TableCell>

                          <TableCell align="center">
                            <DocumentBreakdownBar
                              breakdown={doc.classification}
                            />
                          </TableCell>

                          <TableCell align="center">
                            {isScanned ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={doc.plagiarismScore}
                                  sx={{
                                    width: "100px",
                                    height: 8,
                                    borderRadius: "999px",
                                    mr: 1.5,
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    "& .MuiLinearProgress-bar": {
                                      background:
                                        doc.plagiarismScore > 20
                                          ? "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)"
                                          : "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                                      borderRadius: "999px",
                                    },
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "white",
                                    fontWeight: 700,
                                    minWidth: "40px",
                                  }}
                                >
                                  {doc.plagiarismScore}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ color: "rgba(255,255,255,0.4)" }}
                              >
                                {doc.status !== "Failed" ? "Pending" : "—"}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={doc.status}
                              color={statusColorMap[doc.status]}
                              icon={
                                doc.status === "Scanning" ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : undefined
                              }
                              sx={{
                                fontWeight: 700,
                                borderRadius: "8px",
                                px: 1,
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip
                              title={
                                isScanned
                                  ? "View Detailed Report"
                                  : "Scan required"
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() => handleViewReport(doc.name)}
                                  disabled={!isScanned}
                                  sx={{
                                    color: "#8B5CF6",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      transform: "scale(1.1)",
                                      color: "#A78BFA",
                                    },
                                    "&:disabled": {
                                      color: "rgba(139, 92, 246, 0.3)",
                                    },
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={totalDocuments}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                sx={{
                  color: "white",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  "& .MuiTablePagination-actions button": {
                    color: "white",
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 600,
                    },
                }}
              />
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      </GlassCard>
    </Box>
  );
};

export default ProjectDetailsDashboard;
