import axiosClient from "../../apis/axiosClient";

export const routeOptimizationService = {
    async listTrips({ date, routeId } = {}) {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (routeId) params.append("route_id", routeId);

        const query = params.toString();
        const url = query
            ? `/admin/route-optimization/trips?${query}`
            : `/admin/route-optimization/trips`;

        const response = await axiosClient.get(url);
        return response.data;
    },

    async fetchTripLocations(tripId) {
        if (!tripId) {
            throw new Error("Trip ID không hợp lệ");
        }
        const response = await axiosClient.get(
            `/admin/route-optimization/trip/${tripId}/locations`
        );
        return response.data;
    },

    async optimizeTrip({
        tripId,
        optimizeType = "dropoff",
        startPickupLocation,
        startDropoffLocation,
    }) {
        if (!tripId) {
            throw new Error("Trip ID không hợp lệ");
        }

        const params = new URLSearchParams();

        if (optimizeType) {
            params.append("optimize_type", optimizeType);
        }
        if (startPickupLocation) {
            params.append("start_pickup_location", startPickupLocation);
        }
        if (startDropoffLocation) {
            params.append("start_dropoff_location", startDropoffLocation);
        }

        const query = params.toString();
        const url = query
            ? `/admin/route-optimization/trip/${tripId}?${query}`
            : `/admin/route-optimization/trip/${tripId}`;

        const response = await axiosClient.get(url);
        return response.data;
    },
};

