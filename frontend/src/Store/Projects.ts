import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { aesDecrypt, aesEncrypt } from "../Utils/Encryption";

const PROJECTS_STORAGE_KEY = "encrypted_project_data";
/** Interface for the encrypted data structure stored in localStorage. */
interface StoredProjectData {
  encryptedData: string;
  timestamp: number; // UTC timestamp of when it was saved
}

/**
 * Type definition for a Project Model.
 */
export interface ProjectModel {
  id: string;
  name: string;
  status: string; // default "active"
  documents: string[]; // array of document IDs
  lastScanDate?: string; // ISO string of last scan date, optional
}

/**
 * Type definition for the Project slice state.
 */
interface ProjectState {
  projects: ProjectModel[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  status: "idle",
  error: null,
};

/** Arguments for both fetchProjects and refreshProjects */
interface RefreshProjectsArgs {
  authToken: string;
  force?: boolean;
}

/**
 * Async Thunk to fetch project data from the API (Server Call).
 * This remains the core function for communicating with the backend.
 */
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (authToken: string, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:5000/api/project", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      const ev = await response.json();
      const data: ProjectModel[] = ev.projects;
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Async Thunk to manage project loading: from localStorage (encrypted) or Server.
 * Logic: force=true OR data is too old OR data is missing/corrupted -> Call Server.
 * Otherwise -> Load from encrypted localStorage.
 */
export const refreshProjects = createAsyncThunk(
  "projects/refreshProjects",
  async (
    { authToken, force = false }: RefreshProjectsArgs,
    { dispatch, rejectWithValue }
  ) => {
    const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;

    /** Helper function to execute and handle the server call via fetchProjects */
    const fetchFromServer = async () => {
      console.log("-> Executing server fetch...");
      // Dispatch the existing fetchProjects thunk
      const result = await dispatch(fetchProjects(authToken));

      if (fetchProjects.fulfilled.match(result)) {
        // Successfully fetched from server, now encrypt and store in localStorage
        const dataToStore: StoredProjectData = {
          encryptedData: aesEncrypt<ProjectModel[]>(result.payload),
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(
            PROJECTS_STORAGE_KEY,
            JSON.stringify(dataToStore)
          );
        } catch (e) {
          console.error("Could not save to localStorage:", e);
        }
        return result.payload; // Return the project data
      } else {
        // Server fetch failed, reject the thunk
        return rejectWithValue(
          result.payload || result.error.message || "Server fetch failed"
        );
      }
    };

    // 1. Check for force flag
    if (force) {
      console.log("Force refresh requested. Bypassing local storage check.");
      return fetchFromServer();
    }

    // 2. Attempt to load from localStorage
    const cachedDataString = localStorage.getItem(PROJECTS_STORAGE_KEY);

    if (cachedDataString) {
      try {
        const cachedData: StoredProjectData = JSON.parse(cachedDataString);
        const age = Date.now() - cachedData.timestamp;

        // 3. Check for data freshness (30 minutes)
        if (age < THIRTY_MINUTES_IN_MS) {
          console.log(
            `Loading projects from encrypted cache. Data age: ${Math.round(age / 1000)}s`
          );

          const decryptedJson = aesDecrypt<ProjectModel[]>(
            cachedData.encryptedData
          );
          if (!decryptedJson) {
            throw new Error("Decryption failed. Data might be corrupted.");
          }

          const cachedProjects: ProjectModel[] = decryptedJson;

          // Manually update the state when loading from cache
          dispatch(setProjects(cachedProjects));
          return cachedProjects;
        } else {
          // 4. Data is too old
          console.log(
            "Cached data is older than 30 minutes. Refreshing from server."
          );
          return fetchFromServer();
        }
      } catch (e) {
        // 5. Corrupted data (JSON parse or Decrypt error)
        console.error(
          "Error processing cached data or decryption failed. Refreshing from server.",
          e
        );
        return fetchFromServer();
      }
    } else {
      // 6. No cached data
      console.log("No cached data found. Refreshing from server.");
      return fetchFromServer();
    }
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // ✅ Replace all projects (used by refreshProjects when loading from cache)
    setProjects(state, action: PayloadAction<ProjectModel[]>) {
      state.projects = action.payload;
    },

    // ✅ Clear all projects
    clearProjects(state) {
      state.projects = [];
    },
  },

  // Extra reducers to handle the lifecycle of the async thunks
  extraReducers: (builder) => {
    builder
      // --- Handled by fetchProjects (when called directly or via refreshProjects) ---
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchProjects.fulfilled,
        (state, action: PayloadAction<ProjectModel[]>) => {
          state.status = "succeeded";
          state.projects = action.payload; // Set the data received from the API
          state.error = null;
        }
      )
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Server fetch failed";
        state.projects = [];
      })

      // --- Handled by refreshProjects (for managing initial status/error) ---
      .addCase(refreshProjects.pending, (state) => {
        // Only set to loading if it's not already loading (from fetchProjects)
        if (state.status === "idle" || state.status === "failed") {
          state.status = "loading";
          state.error = null;
        }
      })
      // When fulfilled, the state is already updated either by fetchProjects or by setProjects (from cache)
      .addCase(refreshProjects.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(refreshProjects.rejected, (state, action) => {
        // Only override status if fetchProjects didn't already reject
        if (state.status !== "failed") {
          state.status = "failed";
          state.error =
            (action.payload as string) ||
            action.error.message ||
            "Refresh failed";
          state.projects = [];
        }
      });
  },
});

export const { setProjects, clearProjects } = projectSlice.actions;
export default projectSlice.reducer;
