import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface DocumentModel {
  id: string;
  document_name: string;
  result: Record<string, any>; // same as Python dict
}

interface DocumentState {
  documents: DocumentModel[];
}

const initialState: DocumentState = {
  documents: [],
};

const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    // ✅ Set all documents (replace existing)
    setDocuments(state, action: PayloadAction<DocumentModel[]>) {
      state.documents = action.payload;
    },

    // ✅ Clear all documents
    clearDocuments(state) {
      state.documents = [];
    },
  },
});

export const { setDocuments, clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;
