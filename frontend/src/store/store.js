import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import locationReducer from "./slices/locationSlice";
import routeReducer from "./slices/routeSlice";
import busTypeReducer from "./slices/busTypeSlice";
import busReducer from "./slices/busSlice";
import tripReducer from "./slices/tripSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        location: locationReducer,
        route: routeReducer,
        busType: busTypeReducer,
        bus: busReducer,
        trip: tripReducer,
    },
});
