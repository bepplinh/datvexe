import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { financialReportService } from "../../services/financialReportService";

// Async thunks
export const fetchFinancialOverview = createAsyncThunk(
    "financialReport/fetchOverview",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getOverview(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải tổng quan tài chính"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message ||
                    "Không thể tải tổng quan tài chính"
            );
        }
    }
);

export const fetchRevenue = createAsyncThunk(
    "financialReport/fetchRevenue",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getRevenue(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo doanh thu"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message || "Không thể tải báo cáo doanh thu"
            );
        }
    }
);

export const fetchRefunds = createAsyncThunk(
    "financialReport/fetchRefunds",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getRefunds(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo hoàn tiền"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message || "Không thể tải báo cáo hoàn tiền"
            );
        }
    }
);

export const fetchCoupons = createAsyncThunk(
    "financialReport/fetchCoupons",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getCoupons(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo coupon"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message || "Không thể tải báo cáo coupon"
            );
        }
    }
);

export const fetchModifications = createAsyncThunk(
    "financialReport/fetchModifications",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getModifications(
                params
            );
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo đổi ghế/đổi chuyến"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message ||
                    "Không thể tải báo cáo đổi ghế/đổi chuyến"
            );
        }
    }
);

export const fetchReconciliation = createAsyncThunk(
    "financialReport/fetchReconciliation",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getReconciliation(
                params
            );
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải đối soát"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message || "Không thể tải đối soát"
            );
        }
    }
);

export const fetchCustomers = createAsyncThunk(
    "financialReport/fetchCustomers",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getCustomers(params);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo khách hàng"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message ||
                    "Không thể tải báo cáo khách hàng"
            );
        }
    }
);

export const fetchCancellations = createAsyncThunk(
    "financialReport/fetchCancellations",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await financialReportService.getCancellations(
                params
            );
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(
                response.message || "Không thể tải báo cáo hủy/hoàn/đổi vé"
            );
        } catch (error) {
            return rejectWithValue(
                error.response.data.message ||
                    "Không thể tải báo cáo hủy/hoàn/đổi vé"
            );
        }
    }
);

const initialState = {
    overview: null,
    revenue: null,
    refunds: null,
    coupons: null,
    modifications: null,
    reconciliation: null,
    customers: null,
    cancellations: null,
    filters: {
        fromDate: null,
        toDate: null,
        period: "month",
    },
    loading: {
        overview: false,
        revenue: false,
        refunds: false,
        coupons: false,
        modifications: false,
        reconciliation: false,
        customers: false,
        cancellations: false,
    },
    errors: {
        overview: null,
        revenue: null,
        refunds: null,
        coupons: null,
        modifications: null,
        reconciliation: null,
        customers: null,
        cancellations: null,
    },
};

const financialReportSlice = createSlice({
    name: "financialReport",
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = {
                ...state.filters,
                ...action.payload,
            };
        },
        clearErrors: (state) => {
            state.errors = {
                overview: null,
                revenue: null,
                refunds: null,
                coupons: null,
                modifications: null,
                reconciliation: null,
                customers: null,
                cancellations: null,
            };
        },
        resetFinancialReport: () => initialState,
    },
    extraReducers: (builder) => {
        // Overview
        builder
            .addCase(fetchFinancialOverview.pending, (state) => {
                state.loading.overview = true;
                state.errors.overview = null;
            })
            .addCase(fetchFinancialOverview.fulfilled, (state, action) => {
                state.loading.overview = false;
                state.overview = action.payload;
                state.errors.overview = null;
            })
            .addCase(fetchFinancialOverview.rejected, (state, action) => {
                state.loading.overview = false;
                state.errors.overview = action.payload;
            });

        // Revenue
        builder
            .addCase(fetchRevenue.pending, (state) => {
                state.loading.revenue = true;
                state.errors.revenue = null;
            })
            .addCase(fetchRevenue.fulfilled, (state, action) => {
                state.loading.revenue = false;
                state.revenue = action.payload;
                state.errors.revenue = null;
            })
            .addCase(fetchRevenue.rejected, (state, action) => {
                state.loading.revenue = false;
                state.errors.revenue = action.payload;
            });

        // Refunds
        builder
            .addCase(fetchRefunds.pending, (state) => {
                state.loading.refunds = true;
                state.errors.refunds = null;
            })
            .addCase(fetchRefunds.fulfilled, (state, action) => {
                state.loading.refunds = false;
                state.refunds = action.payload;
                state.errors.refunds = null;
            })
            .addCase(fetchRefunds.rejected, (state, action) => {
                state.loading.refunds = false;
                state.errors.refunds = action.payload;
            });

        // Coupons
        builder
            .addCase(fetchCoupons.pending, (state) => {
                state.loading.coupons = true;
                state.errors.coupons = null;
            })
            .addCase(fetchCoupons.fulfilled, (state, action) => {
                state.loading.coupons = false;
                state.coupons = action.payload;
                state.errors.coupons = null;
            })
            .addCase(fetchCoupons.rejected, (state, action) => {
                state.loading.coupons = false;
                state.errors.coupons = action.payload;
            });

        // Modifications
        builder
            .addCase(fetchModifications.pending, (state) => {
                state.loading.modifications = true;
                state.errors.modifications = null;
            })
            .addCase(fetchModifications.fulfilled, (state, action) => {
                state.loading.modifications = false;
                state.modifications = action.payload;
                state.errors.modifications = null;
            })
            .addCase(fetchModifications.rejected, (state, action) => {
                state.loading.modifications = false;
                state.errors.modifications = action.payload;
            });

        // Reconciliation
        builder
            .addCase(fetchReconciliation.pending, (state) => {
                state.loading.reconciliation = true;
                state.errors.reconciliation = null;
            })
            .addCase(fetchReconciliation.fulfilled, (state, action) => {
                state.loading.reconciliation = false;
                state.reconciliation = action.payload;
                state.errors.reconciliation = null;
            })
            .addCase(fetchReconciliation.rejected, (state, action) => {
                state.loading.reconciliation = false;
                state.errors.reconciliation = action.payload;
            });

        // Customers
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.loading.customers = true;
                state.errors.customers = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading.customers = false;
                state.customers = action.payload;
                state.errors.customers = null;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading.customers = false;
                state.errors.customers = action.payload;
            });

        // Cancellations
        builder
            .addCase(fetchCancellations.pending, (state) => {
                state.loading.cancellations = true;
                state.errors.cancellations = null;
            })
            .addCase(fetchCancellations.fulfilled, (state, action) => {
                state.loading.cancellations = false;
                state.cancellations = action.payload;
                state.errors.cancellations = null;
            })
            .addCase(fetchCancellations.rejected, (state, action) => {
                state.loading.cancellations = false;
                state.errors.cancellations = action.payload;
            });
    },
});

export const { setFilters, clearErrors, resetFinancialReport } =
    financialReportSlice.actions;
export default financialReportSlice.reducer;
