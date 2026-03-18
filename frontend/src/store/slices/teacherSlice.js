import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  assignments: [], // Subjects assigned to this teacher
  studentsMarks: [], // List of students for the selected class/subject assignment
  isLoading: false,
  error: null,
};

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    setAssignments: (state, action) => { state.assignments = action.payload; },
    setStudentsMarks: (state, action) => { state.studentsMarks = action.payload; },
    setLoading: (state, action) => { state.isLoading = action.payload; }
  },
});

export const { setAssignments, setStudentsMarks, setLoading } = teacherSlice.actions;
export default teacherSlice.reducer;
