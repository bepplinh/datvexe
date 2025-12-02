import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminBusTypeService } from "../../services/admin/busTypeService";

// Async thunks
export const fetchBusTypes = createAsyncThunk(
    "busType/fetchBusTypes",
    async (_, { rejectWithValue }) => {
        try {
            const response = await adminBusTypeService.getBusTypes();
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách loại xe"
            );
        }
    }
);

export const fetchBusTypeById = createAsyncThunk(
    "busType/fetchBusTypeById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await adminBusTypeService.getBusTypeById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin loại xe"
            );
        }
    }
);

export const createBusType = createAsyncThunk(
    "busType/createBusType",
    async (busTypeData, { rejectWithValue }) => {
        try {
            const response = await adminBusTypeService.createBusType(busTypeData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo loại xe"
            );
        }
    }
);

export const updateBusType = createAsyncThunk(
    "busType/updateBusType",
    async ({ id, busTypeData }, { rejectWithValue }) => {
        try {
            const response = await adminBusTypeService.updateBusType(
                id,
                busTypeData
            );
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể cập nhật loại xe"
            );
        }
    }
);

export const deleteBusType = createAsyncThunk(
    "busType/deleteBusType",
    async (id, { rejectWithValue }) => {
        try {
            await adminBusTypeService.deleteBusType(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa loại xe"
            );
        }
    }
);

const initialState = {
    busTypes: [],
    currentBusType: null,
    loading: false,
    error: null,
};

const busTypeSlice = createSlice({
    name: "busType",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentBusType: (state) => {
            state.currentBusType = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch bus types
        builder
            .addCase(fetchBusTypes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusTypes.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                const responseData = action.payload?.data || action.payload;
                state.busTypes = Array.isArray(responseData)
                    ? responseData
                    : [];
            })
            .addCase(fetchBusTypes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch bus type by ID
        builder
            .addCase(fetchBusTypeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusTypeById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBusType =
                    action.payload?.data || action.payload;
            })
            .addCase(fetchBusTypeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create bus type
        builder
            .addCase(createBusType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBusType.fulfilled, (state, action) => {
                state.loading = false;
                const newBusType = action.payload?.data || action.payload;
                state.busTypes.unshift(newBusType);
            })
            .addCase(createBusType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update bus type
        builder
            .addCase(updateBusType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBusType.fulfilled, (state, action) => {
                state.loading = false;
                const updatedBusType = action.payload?.data || action.payload;
                const index = state.busTypes.findIndex(
                    (bt) => bt.id === updatedBusType.id
                );
                if (index !== -1) {
                    state.busTypes[index] = updatedBusType;
                }
                if (state.currentBusType?.id === updatedBusType.id) {
                    state.currentBusType = updatedBusType;
                }
            })
            .addCase(updateBusType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete bus type
        builder
            .addCase(deleteBusType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBusType.fulfilled, (state, action) => {
                state.loading = false;
                state.busTypes = state.busTypes.filter(
                    (bt) => bt.id !== action.payload
                );
                if (state.currentBusType?.id === action.payload) {
                    state.currentBusType = null;
                }
            })
            .addCase(deleteBusType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearCurrentBusType } = busTypeSlice.actions;

export default busTypeSlice.reducer;

