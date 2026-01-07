import { useState, useEffect, useRef } from "react";
import axiosClient from "../../../../../apis/axiosClient";

export const useUserDetailData = (user, activeTab) => {
    const [userTickets, setUserTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    const isMountedRef = useRef(true);
    const fetchedUserIdRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Reset data when user changes
    useEffect(() => {
        if (user?.id) {
             // If user ID changed significantly (different user object logic usually checks ID)
             // logic is handled in the fetching effects by checking ref
        } else {
             setUserTickets([]);
             fetchedUserIdRef.current = null;
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        // Fetch tickets
        if (activeTab === "tickets" && fetchedUserIdRef.current !== `tickets-${user.id}`) {
             fetchUserTickets();
             fetchedUserIdRef.current = `tickets-${user.id}`;
        }
    }, [user?.id, activeTab]);

    const fetchUserTickets = async () => {
        try {
            setLoadingTickets(true);
            const response = await axiosClient.get(
                `/admin/bookings?user_id=${user.id}`
            );

            if (!isMountedRef.current) return;

            const bookings = response.data?.data?.data || [];
            setUserTickets(bookings);
        } catch (error) {
            console.error("Error fetching user tickets:", error);
        } finally {
            if (isMountedRef.current) {
                setLoadingTickets(false);
            }
        }
    };

    return {
        userTickets,
        loadingTickets
    };
};
