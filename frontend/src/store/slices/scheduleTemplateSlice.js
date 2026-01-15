import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { scheduleTemplateService } from "../../services/admin/scheduleTemplateService";

// Async thunks
export const fetchTemplates = createAsyncThunk(
    "scheduleTemplate/fetchTemplates",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await scheduleTemplateService.getTemplates(params);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách lịch mẫu"
            );
        }
    }
);

export const getTemplateById = createAsyncThunk(
    "scheduleTemplate/getTemplateById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await scheduleTemplateService.getTemplateById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin lịch mẫu"
            );
        }
    }
);

export const createTemplate = createAsyncThunk(
    "scheduleTemplate/createTemplate",
    async (data, { rejectWithValue }) => {
        try {
            const response = await scheduleTemplateService.createTemplate(data);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo lịch mẫu"
            );
        }
    }
);

export const updateTemplate = createAsyncThunk(
    "scheduleTemplate/updateTemplate",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await scheduleTemplateService.updateTemplate(
                id,
                data
            );
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể cập nhật lịch mẫu"
            );
        }
    }
);

export const deleteTemplate = createAsyncThunk(
    "scheduleTemplate/deleteTemplate",
    async (id, { rejectWithValue }) => {
        try {
            await scheduleTemplateService.deleteTemplate(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa lịch mẫu"
            );
        }
    }
);

export const generateTripsFromTemplates = createAsyncThunk(
    "scheduleTemplate/generateTrips",
    async (data, { rejectWithValue }) => {
        try {
            const response = await scheduleTemplateService.generateTrips(data);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể sinh chuyến xe"
            );
        }
    }
);

// Initial state
const initialState = {
    templates: [],
    currentTemplate: null,
    loading: false,
    error: null,
    generateResult: null,
    generateLoading: false,
    generateError: null,
    pagination: {
        current_page: 1,
        per_page: 100,
        total: 0,
        last_page: 1,
    },
};

// Slice
const scheduleTemplateSlice = createSlice({
    name: "scheduleTemplate",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentTemplate: (state) => {
            state.currentTemplate = null;
        },
        clearGenerateResult: (state) => {
            state.generateResult = null;
            state.generateError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch templates
            .addCase(fetchTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTemplates.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload?.data || action.payload;
                if (Array.isArray(payload)) {
                    state.templates = payload;
                } else if (payload?.data) {
                    state.templates = payload.data;
                    if (payload.current_page) {
                        state.pagination = {
                            current_page: payload.current_page,
                            per_page: payload.per_page || 100,
                            total: payload.total || 0,
                            last_page: payload.last_page || 1,
                        };
                    }
                } else {
                    state.templates = [];
                }
            })
            .addCase(fetchTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.templates = [];
            })

            // Get template by ID
            .addCase(getTemplateById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTemplateById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTemplate = action.payload?.data || action.payload;
            })
            .addCase(getTemplateById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create template
            .addCase(createTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTemplate.fulfilled, (state, action) => {
                state.loading = false;
                const newTemplate = action.payload?.data || action.payload;
                if (newTemplate) {
                    state.templates.push(newTemplate);
                }
            })
            .addCase(createTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update template
            .addCase(updateTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTemplate.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload?.data || action.payload;
                if (updated?.id) {
                    const index = state.templates.findIndex(
                        (t) => t.id === updated.id
                    );
                    if (index !== -1) {
                        state.templates[index] = updated;
                    }
                }
            })
            .addCase(updateTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete template
            .addCase(deleteTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.templates = state.templates.filter(
                    (t) => t.id !== action.payload
                );
            })
            .addCase(deleteTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Generate trips
            .addCase(generateTripsFromTemplates.pending, (state) => {
                state.generateLoading = true;
                state.generateError = null;
                state.generateResult = null;
            })
            .addCase(generateTripsFromTemplates.fulfilled, (state, action) => {
                state.generateLoading = false;
                state.generateResult = action.payload?.data || action.payload;
            })
            .addCase(generateTripsFromTemplates.rejected, (state, action) => {
                state.generateLoading = false;
                state.generateError = action.payload;
            });
    },
});

export const { clearError, clearCurrentTemplate, clearGenerateResult } =
    scheduleTemplateSlice.actions;

export default scheduleTemplateSlice.reducer;
