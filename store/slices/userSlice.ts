import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { citizenService } from '@/services/citizen.service';

interface UserState {
    points: number;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    points: 0,
    loading: false,
    error: null,
};

export const fetchPoints = createAsyncThunk(
    'user/fetchPoints',
    async (_, { rejectWithValue }) => {
        try {
            const response = await citizenService.getMyPoints();
            if (response.success && response.data) {
                return response.data.points;
            }
            return rejectWithValue(response.error || 'Failed to fetch points');
        } catch (error: any) {
            return rejectWithValue(error.message || 'An error occurred');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setPoints: (state, action: PayloadAction<number>) => {
            state.points = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPoints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPoints.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.points = action.payload;
            })
            .addCase(fetchPoints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setPoints } = userSlice.actions;
export default userSlice.reducer;
