import { createSlice } from '@reduxjs/toolkit';

// We'll define AsyncThunks later for fetching data from the actual API

const initialState = {
  classes: [],
  teachers: [],
  students: [],
  exams: [],
  assignments: [], // teacher -> class/subject mapping
  school: { name: '', address: '', email: '', logoUrl: '', signatureUrl: '' },
  isLoading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setClasses: (state, action) => { state.classes = action.payload; },
    setTeachers: (state, action) => { state.teachers = action.payload; },
    setStudents: (state, action) => { state.students = action.payload; },
    setExams: (state, action) => { state.exams = action.payload; },
    setAssignments: (state, action) => { state.assignments = action.payload; },
    setSchool: (state, action) => { state.school = action.payload; },
    setLoading: (state, action) => { state.isLoading = action.payload; }
  },
});

export const { setClasses, setTeachers, setStudents, setExams, setAssignments, setSchool, setLoading } = adminSlice.actions;
export default adminSlice.reducer;
