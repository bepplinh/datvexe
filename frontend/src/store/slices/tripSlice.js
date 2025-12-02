import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminTripService } from "../../services/admin/tripService";

export const fetchTrips = createAsyncThunk(
    "trip/fetchTrips",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await adminTripService.getTrips(params);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách chuyến xe"
            );
        }
    }
);

export const getTripById = createAsyncThunk(
    "trip/getTripById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await adminTripService.getTripById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin chuyến xe"
            );
        }
    }
);

export const createTrip = createAsyncThunk(
    "trip/createTrip",
    async (tripData, { rejectWithValue }) => {
        try {
            const response = await adminTripService.createTrip(tripData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo chuyến xe"
            );
        }
    }
);

export const updateTrip = createAsyncThunk(
    "trip/updateTrip",
    async ({ id, tripData }, { rejectWithValue }) => {
        try {
            const response = await adminTripService.updateTrip(id, tripData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể cập nhật chuyến xe"
            );
        }
    }
);

export const deleteTrip = createAsyncThunk(
    "trip/deleteTrip",
    async (tripId, { rejectWithValue }) => {
        try {
            await adminTripService.deleteTrip(tripId);
            return tripId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa chuyến xe"
            );
        }
    }
);

const initialState = {
    trips: [],
    currentTrip: null,
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    },
};

const tripSlice = createSlice({
    name: "trip",
    initialState,
    reducers: {
        clearTripError: (state) => {
            state.error = null;
        },
        clearCurrentTrip: (state) => {
            state.currentTrip = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTrips.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTrips.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                const payload = action.payload?.data || action.payload;
                if (Array.isArray(payload)) {
                    state.trips = payload;
                } else if (payload?.data) {
                    state.trips = payload.data;
                    if (payload.current_page) {
                        state.pagination = {
                            current_page: payload.current_page,
                            per_page: payload.per_page || 15,
                            total: payload.total || 0,
                            last_page: payload.last_page || 1,
                        };
                    }
                } else {
                    state.trips = [];
                }
            })
            .addCase(fetchTrips.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.trips = [];
            })
            .addCase(getTripById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTripById.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.currentTrip = action.payload?.data || action.payload;
            })
            .addCase(getTripById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.currentTrip = null;
            })
            .addCase(createTrip.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTrip.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload?.data || action.payload;
                if (payload) {
                    state.trips.unshift(payload);
                }
            })
            .addCase(createTrip.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateTrip.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTrip.fulfilled, (state, action) => {
                state.loading = false;
                const updatedTrip = action.payload?.data || action.payload;
                if (updatedTrip?.id) {
                    const index = state.trips.findIndex(
                        (trip) => trip.id === updatedTrip.id
                    );
                    if (index !== -1) {
                        state.trips[index] = updatedTrip;
                    }
                    if (state.currentTrip?.id === updatedTrip.id) {
                        state.currentTrip = updatedTrip;
                    }
                }
            })
            .addCase(updateTrip.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteTrip.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTrip.fulfilled, (state, action) => {
                state.loading = false;
                state.trips = state.trips.filter(
                    (trip) => trip.id !== action.payload
                );
                if (state.currentTrip?.id === action.payload) {
                    state.currentTrip = null;
                }
            })
            .addCase(deleteTrip.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearTripError, clearCurrentTrip } = tripSlice.actions;

export default tripSlice.reducer;

