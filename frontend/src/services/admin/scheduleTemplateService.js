import axiosClient from "../../apis/axiosClient";

export const scheduleTemplateService = {
    /**
     * Get all schedule templates with optional filters
     * @param {Object} params - Query parameters
     * @param {number} params.weekday - Filter by weekday (0-6)
     * @param {boolean} params.active - Filter by active status
     * @param {number} params.per_page - Items per page
     */
    async getTemplates(params = {}) {
        const { weekday, active, per_page, page } = params;

        const queryParams = new URLSearchParams();
        if (weekday !== undefined)
            queryParams.append("weekday", String(weekday));
        if (active !== undefined) queryParams.append("active", String(active));
        if (per_page) queryParams.append("per_page", String(per_page));
        if (page) queryParams.append("page", String(page));

        const queryString = queryParams.toString();
        const url = queryString
            ? `/schedule-template-trips?${queryString}`
            : "/schedule-template-trips";
        const response = await axiosClient.get(url);
        return response.data;
    },

    /**
     * Get a single template by ID
     * @param {number} id - Template ID
     */
    async getTemplateById(id) {
        const response = await axiosClient.get(
            `/schedule-template-trips/${id}`
        );
        return response.data;
    },

    /**
     * Create a new schedule template
     * @param {Object} data - Template data
     * @param {number} data.route_id - Route ID
     * @param {number} data.bus_id - Bus ID
     * @param {number} data.weekday - Weekday (0=Sunday, 1=Monday...6=Saturday)
     * @param {string} data.departure_time - Departure time (HH:mm format)
     * @param {boolean} data.active - Active status
     */
    async createTemplate(data) {
        const response = await axiosClient.post(
            "/schedule-template-trips",
            data
        );
        return response.data;
    },

    /**
     * Update an existing template
     * @param {number} id - Template ID
     * @param {Object} data - Updated data
     */
    async updateTemplate(id, data) {
        const response = await axiosClient.put(
            `/schedule-template-trips/${id}`,
            data
        );
        return response.data;
    },

    /**
     * Delete a template
     * @param {number} id - Template ID
     */
    async deleteTemplate(id) {
        const response = await axiosClient.delete(
            `/schedule-template-trips/${id}`
        );
        return response.data;
    },

    /**
     * Generate trips from templates
     * @param {Object} data - Generation parameters
     * @param {string} data.range - 'day', 'week', or 'month'
     * @param {string} data.date - Date for single day (YYYY-MM-DD)
     * @param {string} data.start_date - Start date for week range
     * @param {string} data.month - Month for month range (YYYY-MM)
     * @param {number[]} data.template_ids - Optional specific template IDs
     */
    async generateTrips(data) {
        const response = await axiosClient.post(
            "/trips/generate-from-templates",
            data
        );
        return response.data;
    },
};
