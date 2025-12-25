import { useEffect, useRef } from "react";
import { adminBookingService } from "../../../../../../services/admin/bookingService";

const usePhonePrefill = ({ isOpen, customerPhone, setValue }) => {
    const phoneSearchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        if (phoneSearchTimeoutRef.current) clearTimeout(phoneSearchTimeoutRef.current);

        const rawPhone = (customerPhone || "").trim();
        if (!rawPhone || rawPhone.length < 8) return;

        phoneSearchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await adminBookingService.findUserByPhone(rawPhone);
                const users = res?.data?.data || res?.data || [];
                const user = Array.isArray(users) ? users[0] : null;

                if (user && customerPhone) {
                    setValue("customer_name", user.name || user.username || "");
                    if (user.email) setValue("customer_email", user.email);
                }
            } catch {
                // silent fail
            }
        }, 500);

        return () => {
            if (phoneSearchTimeoutRef.current) clearTimeout(phoneSearchTimeoutRef.current);
        };
    }, [customerPhone, isOpen, setValue]);
};

export default usePhonePrefill;

