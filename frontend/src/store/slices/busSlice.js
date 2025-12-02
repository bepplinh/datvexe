import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminBusService } from "../../services/admin/busService";

// Async thunks
export const fetchBuses = createAsyncThunk(
    "bus/fetchBuses",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await adminBusService.getBuses(params);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách xe"
            );
        }
    }
);

export const fetchBusById = createAsyncThunk(
    "bus/fetchBusById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await adminBusService.getBusById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin xe"
            );
        }
    }
);

export const createBus = createAsyncThunk(
    "bus/createBus",
    async (busData, { rejectWithValue }) => {
        try {
            const response = await adminBusService.createBus(busData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo xe"
            );
        }
    }
);

export const updateBus = createAsyncThunk(
    "bus/updateBus",
    async ({ id, busData }, { rejectWithValue }) => {
        try {
            const response = await adminBusService.updateBus(id, busData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể cập nhật xe"
            );
        }
    }
);

export const deleteBus = createAsyncThunk(
    "bus/deleteBus",
    async (id, { rejectWithValue }) => {
        try {
            await adminBusService.deleteBus(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa xe"
            );
        }
    }
);

const initialState = {
    buses: [],
    currentBus: null,
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    },
};

const busSlice = createSlice({
    name: "bus",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentBus: (state) => {
            state.currentBus = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch buses
        builder
            .addCase(fetchBuses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBuses.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                const responseData = action.payload?.data || action.payload;
                if (responseData?.data && Array.isArray(responseData.data)) {
                    state.buses = responseData.data;
                    if (responseData.current_page) {
                        state.pagination = {
                            current_page: responseData.current_page,
                            per_page: responseData.per_page,
                            total: responseData.total,
                            last_page: responseData.last_page,
                        };
                    }
                } else if (Array.isArray(responseData)) {
                    state.buses = responseData;
                } else {
                    state.buses = [];
                }
            })
            .addCase(fetchBuses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch bus by ID
        builder
            .addCase(fetchBusById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBus =
                    action.payload?.data || action.payload;
            })
            .addCase(fetchBusById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create bus
        builder
            .addCase(createBus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBus.fulfilled, (state, action) => {
                state.loading = false;
                const newBus = action.payload?.data?.bus || action.payload?.data || action.payload;
                if (newBus) {
                    state.buses.unshift(newBus);
                }
            })
            .addCase(createBus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update bus
        builder
            .addCase(updateBus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBus.fulfilled, (state, action) => {
                state.loading = false;
                const updatedBus = action.payload?.data || action.payload;
                const index = state.buses.findIndex(
                    (b) => b.id === updatedBus.id
                );
                if (index !== -1) {
                    state.buses[index] = updatedBus;
                }
                if (state.currentBus?.id === updatedBus.id) {
                    state.currentBus = updatedBus;
                }
            })
            .addCase(updateBus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete bus
        builder
            .addCase(deleteBus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBus.fulfilled, (state, action) => {
                state.loading = false;
                state.buses = state.buses.filter(
                    (b) => b.id !== action.payload
                );
                if (state.currentBus?.id === action.payload) {
                    state.currentBus = null;
                }
            })
            .addCase(deleteBus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearCurrentBus } = busSlice.actions;

export default busSlice.reducer;

