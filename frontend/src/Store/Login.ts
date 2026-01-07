import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// --- Cookie Helper Functions ---

const AUTH_COOKIE_NAME = 'auth_token';

/** Sets the JWT token in a cookie with a 7-day expiration. */
const setAuthCookie = (token: string): void => {
    // IMPORTANT: In a real environment, prefer 'HttpOnly' cookies set by the server 
    // for security. Here, we use client-side storage for demonstration.
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // Expires in 7 days
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
};

/** Retrieves the JWT token from the cookie. */
const getAuthCookie = (): string | null => {
    const name = AUTH_COOKIE_NAME + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
};




/** Clears the JWT token cookie immediately. */
const clearAuthCookie = (): void => {
    document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/;`;
};


// --- Slice Definition ---

export interface LoginState {
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  JWTToken: string | null;
}

// Attempt to load the token from the cookie on application startup
const initialToken = getAuthCookie();

const initialState: LoginState = {
  isLoggedIn: !!initialToken, // State is logged in if a token exists
  userName: null,
  userEmail: null,
  JWTToken: initialToken, // Load token from cookie
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  // Pure Reducers: only manipulate state based on the payload
  reducers: {
    login: (state, action: PayloadAction<{ name: string; email: string; JWTToken: string }>) => {
      state.isLoggedIn = true;
      state.userName = action.payload.name;
      state.userEmail = action.payload.email;
      state.JWTToken = action.payload.JWTToken;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userName = null;
      state.userEmail = null;
      state.JWTToken = null;
    },
  },
});

// --- Async Thunks for Side Effects (Cookie Management) ---

interface LoginPayload {
    name: string;
    email: string;
    JWTToken: string;
}

/**
 * Handles the full login process: sets the cookie and updates Redux state.
 * Use this thunk when a user successfully logs in.
 */
const loginUser = createAsyncThunk(
    'login/loginUser',
    async (payload: LoginPayload, { dispatch }) => {
        // 1. Side Effect: Set the cookie
        setAuthCookie(JSON.stringify(payload));

        // 2. Pure Reducer Dispatch: Update the Redux store
        dispatch(loginSlice.actions.login(payload));
    }
);

/**
 * Handles the full logout process: clears the cookie and resets Redux state.
 * Use this thunk when a user logs out.
 */
const logoutUser = createAsyncThunk(
    'login/logoutUser',
    async (_, { dispatch }) => {
        // 1. Side Effect: Clear the cookie
        clearAuthCookie();

        // 2. Pure Reducer Dispatch: Clear the Redux store
        dispatch(loginSlice.actions.logout());
    }
);

export const loadUserFromCookie = createAsyncThunk(
    'login/loadUserFromCookie',
    async (_, { dispatch }) => {
        const token = getAuthCookie();
        if (token) {
            try {
                const userData = JSON.parse(token);
                dispatch(loginSlice.actions.login({
                    name: userData.name,
                    email: userData.email,
                    JWTToken: userData.JWTToken,
                }));
            } catch (error) {
                console.error("Failed to parse auth cookie:", error);
                // If parsing fails, clear the invalid cookie
                clearAuthCookie();
            }
        }
    }
);

export const { login, logout } = loginSlice.actions;

// Export the Thunks as well, so components can dispatch them
export { loginUser, logoutUser }; 

export default loginSlice.reducer;