/**
 * Map dữ liệu contact từ draft API response về format của form
 */
export const mapDraftContactToForm = (
    draftContact = {},
    defaultContact = {}
) => {
    return {
        name: draftContact.name || defaultContact.name || "",
        countryCode: extractCountryCode(draftContact.phone) ||
            defaultContact.countryCode ||
            "+84",
        phone: extractPhoneNumber(draftContact.phone) ||
            defaultContact.phone ||
            "",
        note: firstDefined(draftContact.note, defaultContact.note, ""),
        pickup: draftContact.pickup_address || defaultContact.pickup || "",
        dropoff: draftContact.dropoff_address || defaultContact.dropoff || "",
        isProxyBooking: firstDefined(
            draftContact.is_proxy_booking,
            defaultContact.isProxyBooking,
            false
        ),
        bookerName: firstDefined(
            draftContact.booker_name,
            defaultContact.bookerName,
            ""
        ),
        bookerPhone: firstDefined(
            draftContact.booker_phone,
            defaultContact.bookerPhone,
            ""
        ),
    };
};

const formatFullPhoneNumber = (countryCode = "", phone = "") => {
    const normalizedCode = countryCode ?
        countryCode.startsWith("+") ?
        countryCode :
        `+${countryCode.replace(/\D/g, "")}` :
        "";
    const normalizedPhone = (phone || "").replace(/\D/g, "");
    return normalizedPhone ? `${normalizedCode}${normalizedPhone}` : "";
};

const firstDefined = (...values) => {
    for (const value of values) {
        if (value !== undefined && value !== null) {
            return value;
        }
    }
    return null;
};

export const mapContactFormToDraftPayload = (
    contactInfo = {}, {
        paymentMethod = "cash",
        draftTrips = [],
        couponId = null
    } = {}
) => {
    const passengerPhone = formatFullPhoneNumber(
        contactInfo.countryCode,
        contactInfo.phone
    );

    const basePickup =
        contactInfo.pickup && typeof contactInfo.pickup === "string" ?
        contactInfo.pickup.trim() :
        null;
    const baseDropoff =
        contactInfo.dropoff && typeof contactInfo.dropoff === "string" ?
        contactInfo.dropoff.trim() :
        null;

    const normalizedLegs = (draftTrips || [])
        .map((trip, index) => {
            const legType = (
                (trip && trip.leg) ||
                (index === 0 ? "OUT" : "RETURN")
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
        passenger_name: contactInfo.name && typeof contactInfo.name === "string" ?
            contactInfo.name.trim() :
            "",
        passenger_phone: passengerPhone,
        passenger_email: contactInfo.email && typeof contactInfo.email === "string" ?
            contactInfo.email.trim() :
            null,
        booker_name: contactInfo.isProxyBooking ?
            contactInfo.bookerName &&
            typeof contactInfo.bookerName === "string" ?
            contactInfo.bookerName.trim() || null :
            null :
            null,
        booker_phone: contactInfo.isProxyBooking ?
            contactInfo.bookerPhone &&
            typeof contactInfo.bookerPhone === "string" ?
            contactInfo.bookerPhone.trim() || null :
            null :
            null,
        notes: contactInfo.note && typeof contactInfo.note === "string" ?
            contactInfo.note.trim() :
            null,
        payment_provider: paymentMethod,
        is_round_trip: isRoundTrip,
        legs: normalizedLegs,
        coupon_id: couponId,
    };
};

/**
 * Trích xuất mã quốc gia từ số điện thoại (ví dụ: +84 từ +84123456789)
 */
const extractCountryCode = (phone) => {
    if (!phone) return null;
    const match = phone.match(/^(\+\d{1,3})/);
    return match ? match[1] : null;
};

/**
 * Trích xuất số điện thoại không có mã quốc gia
 */
const extractPhoneNumber = (phone) => {
    if (!phone) return null;
    return phone.replace(/^\+\d{1,3}/, "").trim();
};