import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardService } from "../../services/dashboardService";

// Async thunks
export const fetchOverview = createAsyncThunk(
    "dashboard/fetchOverview",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await dashboardService.getOverview(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(response.message || "Không thể tải tổng quan");
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải tổng quan dashboard"
            );
        }
    }
);

export const fetchComparison = createAsyncThunk(
    "dashboard/fetchComparison",
    async (params, { rejectWithValue }) => {
        try {
            const response = await dashboardService.getComparison(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(response.message || "Không thể tải so sánh kỳ");
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải so sánh kỳ"
            );
        }
    }
);

export const fetchTopMetrics = createAsyncThunk(
    "dashboard/fetchTopMetrics",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await dashboardService.getTopMetrics(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(response.message || "Không thể tải top metrics");
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải top metrics"
            );
        }
    }
);

const initialState = {
    overview: null,
    comparison: null,
    topMetrics: null,
    filters: {
        fromDate: null,
        toDate: null,
        period: "month",
    },
    loading: {
        overview: false,
        comparison: false,
        topMetrics: false,
    },
    errors: {
        overview: null,
        comparison: null,
        topMetrics: null,
    },
};

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearErrors: (state) => {
            state.errors = {
                overview: null,
                comparison: null,
                topMetrics: null,
            };
        },
        resetDashboard: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        // Overview
        builder
            .addCase(fetchOverview.pending, (state) => {
                state.loading.overview = true;
                state.errors.overview = null;
            })
            .addCase(fetchOverview.fulfilled, (state, action) => {
                state.loading.overview = false;
                state.overview = action.payload;
                state.errors.overview = null;
            })
            .addCase(fetchOverview.rejected, (state, action) => {
                state.loading.overview = false;
                state.errors.overview = action.payload;
            });

        // Comparison
        builder
            .addCase(fetchComparison.pending, (state) => {
                state.loading.comparison = true;
                state.errors.comparison = null;
            })
            .addCase(fetchComparison.fulfilled, (state, action) => {
                state.loading.comparison = false;
                state.comparison = action.payload;
                state.errors.comparison = null;
            })
            .addCase(fetchComparison.rejected, (state, action) => {
                state.loading.comparison = false;
                state.errors.comparison = action.payload;
            });

        // Top Metrics
        builder
            .addCase(fetchTopMetrics.pending, (state) => {
                state.loading.topMetrics = true;
                state.errors.topMetrics = null;
            })
            .addCase(fetchTopMetrics.fulfilled, (state, action) => {
                state.loading.topMetrics = false;
                state.topMetrics = action.payload;
                state.errors.topMetrics = null;
            })
            .addCase(fetchTopMetrics.rejected, (state, action) => {
                state.loading.topMetrics = false;
                state.errors.topMetrics = action.payload;
            });
    },
});

export const { setFilters, clearErrors, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

