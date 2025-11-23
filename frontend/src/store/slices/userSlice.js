import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "../../services/userService";

// Async thunks
export const fetchUsers = createAsyncThunk(
    "user/fetchUsers",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await userService.getUsers(params);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải danh sách người dùng"
            );
        }
    }
);

export const fetchUserById = createAsyncThunk(
    "user/fetchUserById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await userService.getUserById(id);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Không thể tải thông tin người dùng"
            );
        }
    }
);

export const createUser = createAsyncThunk(
    "user/createUser",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await userService.createUser(userData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể tạo người dùng"
            );
        }
    }
);

export const updateUser = createAsyncThunk(
    "user/updateUser",
    async ({ id, userData }, { rejectWithValue }) => {
        try {
            const response = await userService.updateUser(id, userData);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể cập nhật người dùng"
            );
        }
    }
);

export const deleteUser = createAsyncThunk(
    "user/deleteUser",
    async (id, { rejectWithValue }) => {
        try {
            await userService.deleteUser(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Không thể xóa người dùng"
            );
        }
    }
);

const initialState = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    },
    searchKeyword: "",
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setSearchKeyword: (state, action) => {
            state.searchKeyword = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch users
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.data) {
                    state.users =
                        action.payload.data.data || action.payload.data;
                    if (action.payload.data.current_page) {
                        state.pagination = {
                            current_page: action.payload.data.current_page,
                            per_page: action.payload.data.per_page,
                            total: action.payload.data.total,
                            last_page: action.payload.data.last_page,
                        };
                    }
                }
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch user by ID
        builder
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload?.data || action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create user
        builder
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                const newUser = action.payload?.data || action.payload;
                state.users.unshift(newUser);
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update user
        builder
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                const updatedUser = action.payload?.data || action.payload;
                const index = state.users.findIndex(
                    (u) => u.id === updatedUser.id
                );
                if (index !== -1) {
                    state.users[index] = updatedUser;
                }
                if (state.currentUser?.id === updatedUser.id) {
                    state.currentUser = updatedUser;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete user
        builder
            .addCase(deleteUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users = state.users.filter(
                    (u) => u.id !== action.payload
                );
                if (state.currentUser?.id === action.payload) {
                    state.currentUser = null;
                }
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setSearchKeyword, clearError, clearCurrentUser } =
    userSlice.actions;
export default userSlice.reducer;
