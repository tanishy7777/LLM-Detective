import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { aesEncrypt, aesDecrypt } from "../Utils/Encryption";

// --- Configuration ---
const USER_STORAGE_KEY = 'encrypted_user_state';


export interface UserState {
  id: string | null;
  name: string;
  email: string;
  storage: number; // Storage used in bytes
  projects: string[];
}

/**
 * Checks localStorage for existing user state and loads it via AES decryption.
 */
const loadInitialState = (): UserState => {
    const encryptedData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (encryptedData) {
      try {
        const decryptedUser = aesDecrypt<UserState>(encryptedData);
        
        // Only return if a valid user object with an ID exists
        if (decryptedUser && decryptedUser.id) {
            console.log("User state loaded and decrypted from local storage.");
            return decryptedUser;
        }
      } catch (error) {
        console.error("Failed to decrypt or parse user state from local storage:", error);
      }
    }
    
    // Default empty state
    return {
        id: null,
        name: "",
        email: "",
        storage: 0,
        projects: [],
    };
};

const initialState: UserState = loadInitialState();

// --- User Slice Definition ---

export const userSlice = createSlice({
  name: "user",
  initialState,
    // Reducers now handle local storage persistence using AES functions
    reducers: {
        setUser: (state, action: PayloadAction<UserState>) => {
            // Update Redux state
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.storage = action.payload.storage;
            state.projects = action.payload.projects;
            
            // Side effect: Encrypt (AES mock) and store data in local storage
            const encryptedData = aesEncrypt<UserState>(action.payload);
            localStorage.setItem(USER_STORAGE_KEY, encryptedData);
        },
        clearUser: (state) => {
            // Update Redux state
            state.id = null;
            state.name = "";
            state.email = "";
            state.storage = 0;
            state.projects = [];

            // Side effect: Clear local storage
            localStorage.removeItem(USER_STORAGE_KEY);
        },
        setStorage: (state, action: PayloadAction<number>) => {
            state.storage = action.payload;

            // Side effect: Update storage value in local storage copy
            const updatedState: UserState = { ...state, storage: action.payload };
            // Encrypt and save the updated state
            const encryptedData = aesEncrypt<UserState>(updatedState);
            localStorage.setItem(USER_STORAGE_KEY, encryptedData);
        },
    },
});

export const { setUser, clearUser, setStorage } = userSlice.actions;
export default userSlice.reducer;