import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import teacherReducer from './slices/teacherSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    teacher: teacherReducer,
  },
});
