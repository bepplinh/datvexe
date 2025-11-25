import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminLocationService } from "../../services/admin/locationService";

// Async thunks
export const fetchLocations = createAsyncThunk(
    "location/fetchLocations",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getLocations(params);
            return response;
        } catch (error) {
            console.error("=== fetchLocations error ===");
            console.error("Error:", error);
            console.error("Error response:", error.response);
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách địa điểm"
            );
        }
    }
);

export const fetchLocationById = createAsyncThunk(
    "location/fetchLocationById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getLocationById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin địa điểm"
            );
        }
    }
);

export const createLocation = createAsyncThunk(
    "location/createLocation",
    async (locationData, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.createLocation(
                locationData
            );
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo địa điểm"
            );
        }
    }
);

export const updateLocation = createAsyncThunk(
    "location/updateLocation",
    async ({ id, locationData }, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.updateLocation(
                id,
                locationData
            );
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể cập nhật địa điểm"
            );
        }
    }
);

export const deleteLocation = createAsyncThunk(
    "location/deleteLocation",
    async (id, { rejectWithValue }) => {
        try {
            await adminLocationService.deleteLocation(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa địa điểm"
            );
        }
    }
);

export const fetchCities = createAsyncThunk(
    "location/fetchCities",
    async (_, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getCities();
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách thành phố"
            );
        }
    }
);

export const fetchDistricts = createAsyncThunk(
    "location/fetchDistricts",
    async (cityId, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getDistricts(cityId);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách quận/huyện"
            );
        }
    }
);

export const fetchWards = createAsyncThunk(
    "location/fetchWards",
    async (districtId, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getWards(districtId);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách phường/xã"
            );
        }
    }
);

export const fetchTreeStructure = createAsyncThunk(
    "location/fetchTreeStructure",
    async (_, { rejectWithValue }) => {
        try {
            const response = await adminLocationService.getTreeStructure();
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tải cây địa điểm"
            );
        }
    }
);

const initialState = {
    locations: [],
    currentLocation: null,
    cities: [],
    districts: [],
    wards: [],
    treeStructure: null,
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    },
    searchKeyword: "",
    filters: {
        type: null,
        parent_id: null,
        parent_type: null,
    },
};

const locationSlice = createSlice({
    name: "location",
    initialState,
    reducers: {
        setSearchKeyword: (state, action) => {
            state.searchKeyword = action.payload;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                type: null,
                parent_id: null,
                parent_type: null,
            };
        },
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentLocation: (state) => {
            state.currentLocation = null;
        },
        clearDistricts: (state) => {
            state.districts = [];
        },
        clearWards: (state) => {
            state.wards = [];
        },
    },
    extraReducers: (builder) => {
        // Fetch locations
        builder
            .addCase(fetchLocations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLocations.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                if (action.payload?.data) {
                    const responseData = action.payload.data;

                    // Xử lý trường hợp phân trang (Laravel pagination)
                    if (responseData.data && Array.isArray(responseData.data)) {
                        state.locations = responseData.data;
                        if (responseData.current_page) {
                            state.pagination = {
                                current_page: responseData.current_page,
                                per_page: responseData.per_page,
                                total: responseData.total,
                                last_page: responseData.last_page,
                            };
                        }
                    }
                    // Xử lý trường hợp không phân trang (array trực tiếp)
                    else if (Array.isArray(responseData)) {
                        state.locations = responseData;
                    }
                    // Xử lý trường hợp collection hoặc object khác
                    else {
                        state.locations = [];
                    }
                } else {
                    state.locations = [];
                }
            })
            .addCase(fetchLocations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch location by ID
        builder
            .addCase(fetchLocationById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLocationById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentLocation = action.payload?.data || action.payload;
            })
            .addCase(fetchLocationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create location
        builder
            .addCase(createLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLocation.fulfilled, (state, action) => {
                state.loading = false;
                const newLocation = action.payload?.data || action.payload;
                state.locations.unshift(newLocation);
            })
            .addCase(createLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update location
        builder
            .addCase(updateLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLocation.fulfilled, (state, action) => {
                state.loading = false;
                const updatedLocation = action.payload?.data || action.payload;
                const index = state.locations.findIndex(
                    (l) => l.id === updatedLocation.id
                );
                if (index !== -1) {
                    state.locations[index] = updatedLocation;
                }
                if (state.currentLocation?.id === updatedLocation.id) {
                    state.currentLocation = updatedLocation;
                }
            })
            .addCase(updateLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete location
        builder
            .addCase(deleteLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLocation.fulfilled, (state, action) => {
                state.loading = false;
                state.locations = state.locations.filter(
                    (l) => l.id !== action.payload
                );
                if (state.currentLocation?.id === action.payload) {
                    state.currentLocation = null;
                }
            })
            .addCase(deleteLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch cities
        builder
            .addCase(fetchCities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload?.data || action.payload || [];
            })
            .addCase(fetchCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch districts
        builder
            .addCase(fetchDistricts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDistricts.fulfilled, (state, action) => {
                state.loading = false;
                state.districts = action.payload?.data || action.payload || [];
            })
            .addCase(fetchDistricts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch wards
        builder
            .addCase(fetchWards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWards.fulfilled, (state, action) => {
                state.loading = false;
                state.wards = action.payload?.data || action.payload || [];
            })
            .addCase(fetchWards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch tree structure
        builder
            .addCase(fetchTreeStructure.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTreeStructure.fulfilled, (state, action) => {
                state.loading = false;
                state.treeStructure = action.payload?.data || action.payload;
            })
            .addCase(fetchTreeStructure.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setSearchKeyword,
    setFilters,
    clearFilters,
    clearError,
    clearCurrentLocation,
    clearDistricts,
    clearWards,
} = locationSlice.actions;

export default locationSlice.reducer;
