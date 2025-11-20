/**
 * Map dữ liệu contact từ draft API response về format của form
 * @param {object} draftContact - Contact data từ API
 * @param {object} defaultContact - Giá trị mặc định
 * @returns {object} Contact info đã được map
 */
export const mapDraftContactToForm = (
    draftContact = {},
    defaultContact = {}
) => {
    return {
        name: draftContact.name || defaultContact.name || "",
        countryCode:
            extractCountryCode(draftContact.phone) ||
            defaultContact.countryCode ||
            "+84",
        phone:
            extractPhoneNumber(draftContact.phone) ||
            defaultContact.phone ||
            "",
        note: draftContact.note ?? defaultContact.note ?? "",
        pickup: draftContact.pickup_address || defaultContact.pickup || "",
        dropoff: draftContact.dropoff_address || defaultContact.dropoff || "",
        isProxyBooking:
            draftContact.is_proxy_booking ??
            defaultContact.isProxyBooking ??
            false,
        bookerName: draftContact.booker_name ?? defaultContact.bookerName ?? "",
        bookerPhone:
            draftContact.booker_phone ?? defaultContact.bookerPhone ?? "",
    };
};

const formatFullPhoneNumber = (countryCode = "", phone = "") => {
    const normalizedCode = countryCode
        ? countryCode.startsWith("+")
            ? countryCode
            : `+${countryCode.replace(/\D/g, "")}`
        : "";
    const normalizedPhone = (phone || "").replace(/\D/g, "");
    return normalizedPhone ? `${normalizedCode}${normalizedPhone}` : "";
};

export const mapContactFormToDraftPayload = (
    contactInfo = {},
    { paymentMethod = "cash", draftTrips = [] } = {}
) => {
    const passengerPhone = formatFullPhoneNumber(
        contactInfo.countryCode,
        contactInfo.phone
    );

    const basePickup = contactInfo.pickup?.trim() || null;
    const baseDropoff = contactInfo.dropoff?.trim() || null;

    const normalizedLegs = (draftTrips || [])
        .map((trip, index) => {
            const legType = (
                trip?.leg || (index === 0 ? "OUT" : "RETURN")
            ).toUpperCase();
            const legPickup = legType === "RETURN" ? baseDropoff : basePickup;
            const legDropoff = legType === "RETURN" ? basePickup : baseDropoff;

            return {
                leg_type: legType,
                pickup_address: legPickup,
                dropoff_address: legDropoff,
            };
        })
        .filter(
            (leg) => leg.pickup_address !== null || leg.dropoff_address !== null
        );

    if (normalizedLegs.length === 0) {
        normalizedLegs.push({
            leg_type: "OUT",
            pickup_address: basePickup,
            dropoff_address: baseDropoff,
        });
    }

    const isRoundTrip = normalizedLegs.some((leg) => leg.leg_type === "RETURN");

    return {
        passenger_name: contactInfo.name?.trim() || "",
        passenger_phone: passengerPhone,
        passenger_email: contactInfo.email?.trim() || null,
        booker_name: contactInfo.isProxyBooking
            ? contactInfo.bookerName?.trim() || null
            : null,
        booker_phone: contactInfo.isProxyBooking
            ? contactInfo.bookerPhone?.trim() || null
            : null,
        notes: contactInfo.note?.trim() || null,
        payment_provider: paymentMethod,
        is_round_trip: isRoundTrip,
        legs: normalizedLegs,
    };
};

/**
 * Trích xuất mã quốc gia từ số điện thoại (ví dụ: +84 từ +84123456789)
 * @param {string} phone - Số điện thoại đầy đủ
 * @returns {string} Mã quốc gia hoặc null
 */
const extractCountryCode = (phone) => {
    if (!phone) return null;
    // Nếu bắt đầu bằng +84, +1, +65...
    const match = phone.match(/^(\+\d{1,3})/);
    return match ? match[1] : null;
};

/**
 * Trích xuất số điện thoại không có mã quốc gia
 * @param {string} phone - Số điện thoại đầy đủ
 * @returns {string} Số điện thoại hoặc null
 */
const extractPhoneNumber = (phone) => {
    if (!phone) return null;
    // Loại bỏ mã quốc gia nếu có
    return phone.replace(/^\+\d{1,3}/, "").trim();
};
