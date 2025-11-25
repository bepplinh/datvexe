import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminRouteService } from "../../services/admin/routeService";

export const fetchRoutes = createAsyncThunk(
    "route/fetchRoutes",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await adminRouteService.getRoutes(params);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách tuyến đường"
            );
        }
    }
);

export const createRoute = createAsyncThunk(
    "route/createRoute",
    async (routeData, { rejectWithValue }) => {
        try {
            const response = await adminRouteService.createRoute(routeData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo tuyến đường"
            );
        }
    }
);

export const updateRoute = createAsyncThunk(
    "route/updateRoute",
    async ({ id, routeData }, { rejectWithValue }) => {
        try {
            const response = await adminRouteService.updateRoute(id, routeData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể cập nhật tuyến đường"
            );
        }
    }
);

export const deleteRoute = createAsyncThunk(
    "route/deleteRoute",
    async (routeId, { rejectWithValue }) => {
        try {
            await adminRouteService.deleteRoute(routeId);
            return routeId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa tuyến đường"
            );
        }
    }
);

const initialState = {
    routes: [],
    loading: false,
    error: null,
    lastFetchParams: {},
};

const routeSlice = createSlice({
    name: "route",
    initialState,
    reducers: {
        clearRouteError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoutes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRoutes.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.routes = action.payload?.data || [];
            })
            .addCase(fetchRoutes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.routes = [];
            })
            .addCase(createRoute.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRoute.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload?.data || action.payload;
                if (payload?.main_route) {
                    state.routes.unshift(payload.main_route);
                }
                if (payload?.reverse_route) {
                    state.routes.unshift(payload.reverse_route);
                }
            })
            .addCase(createRoute.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateRoute.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateRoute.fulfilled, (state, action) => {
                state.loading = false;
                const updatedRoute = action.payload?.data || action.payload;
                if (!updatedRoute?.id) return;
                const index = state.routes.findIndex(
                    (route) => route.id === updatedRoute.id
                );
                if (index !== -1) {
                    state.routes[index] = updatedRoute;
                }
            })
            .addCase(updateRoute.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteRoute.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteRoute.fulfilled, (state, action) => {
                state.loading = false;
                state.routes = state.routes.filter(
                    (route) => route.id !== action.payload
                );
            })
            .addCase(deleteRoute.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearRouteError } = routeSlice.actions;

export default routeSlice.reducer;
