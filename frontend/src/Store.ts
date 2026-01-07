import { configureStore } from "@reduxjs/toolkit";
import login from "./Store/Login";
import user from "./Store/User";
import project from "./Store/Projects";
import document from "./Store/Doc";

export const store = configureStore({
  reducer: {
    login,
    user,
    project,
    document,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
