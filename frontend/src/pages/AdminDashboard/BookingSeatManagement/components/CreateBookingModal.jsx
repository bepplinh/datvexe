import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { createBookingSchema } from "../../../../validation/createBookingSchema";
import useLocationSuggestions from "./CreateBookingModal/hooks/useLocationSuggestions";
import usePhonePrefill from "./CreateBookingModal/hooks/usePhonePrefill";
import ModalHeader from "./CreateBookingModal/ModalHeader";
import ModalFooter from "./CreateBookingModal/ModalFooter";
import CustomerInfoSection from "./CreateBookingModal/CustomerInfoSection";
import TripInfoSection from "./CreateBookingModal/TripInfoSection";
import "./CreateBookingModal.scss";

const resolveSeatIds = (selectedSeats, seatsData) =>
    (selectedSeats || [])
        .map((seat) => {
            if (typeof seat === "string") return seatsData?.[seat]?.seat_id;
            return seat.seat_id || seat.id;
        })
        .filter((id) => id != null);

const CreateBookingModal = ({ isOpen, onClose, trip, selectedSeats, seatsData }) => {
    const defaultValues = useMemo(
        () => ({
            customer_name: "",
            customer_phone: "",
            customer_email: "",
            from_location_id: trip?.from_location_id?.toString() || "",
            to_location_id: trip?.to_location_id?.toString() || "",
            from_location: "",
            to_location: "",
            pickup_address: "",
            dropoff_address: "",
            note: "",
        }),
        [trip]
    );

    const methods = useForm({
        resolver: yupResolver(createBookingSchema),
        defaultValues,
    });

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
        setValue,
        watch,
    } = methods;

    const [focusedLocationField, setFocusedLocationField] = useState(null);

    const customerPhone = watch("customer_phone");
    const fromLocationInput = watch("from_location");
    const toLocationInput = watch("to_location");

    const { suggestions: fromSuggestions, clear: clearFromSuggestions } = useLocationSuggestions(
        fromLocationInput,
        isOpen
    );
    const { suggestions: toSuggestions, clear: clearToSuggestions } = useLocationSuggestions(
        toLocationInput,
        isOpen
    );

    usePhonePrefill({ isOpen, customerPhone, setValue });

    useEffect(() => {
        if (!isOpen) return;
        reset(defaultValues);
        clearFromSuggestions();
        clearToSuggestions();
        setFocusedLocationField(null);
    }, [isOpen, defaultValues, reset, clearFromSuggestions, clearToSuggestions]);

    const handleLocationFocus = (field) => {
        setFocusedLocationField(field);
    };

    const handleLocationBlur = (field) => {
        setTimeout(() => {
            setFocusedLocationField((prev) => (prev === field ? null : prev));
        }, 150);
    };

    const handleLocationSelect = (fieldPrefix, loc) => {
        setValue(`${fieldPrefix}_location`, loc.name);
        setValue(`${fieldPrefix}_location_id`, String(loc.id));
        if (fieldPrefix === "from") clearFromSuggestions();
        if (fieldPrefix === "to") clearToSuggestions();
        setFocusedLocationField(null);
    };

    const onSubmit = async (data) => {
        if (!trip || !selectedSeats || selectedSeats.length === 0) {
            toast.error("Vui lòng chọn ghế trước khi đặt vé");
            return;
        }

        const seatIds = resolveSeatIds(selectedSeats, seatsData);
        if (seatIds.length === 0) {
            toast.error("Không tìm thấy thông tin ghế. Vui lòng thử lại.");
            return;
        }

        try {
            const payload = {
                customer_name: data.customer_name.trim(),
                customer_phone: data.customer_phone.trim(),
                customer_email: data.customer_email?.trim() || null,
                from_location_id: parseInt(data.from_location_id, 10),
                to_location_id: parseInt(data.to_location_id, 10),
                from_location: data.from_location?.trim() || "",
                to_location: data.to_location?.trim() || "",
                pickup_address: data.pickup_address?.trim() || null,
                dropoff_address: data.dropoff_address?.trim() || null,
                note: data.note?.trim() || null,
                trips: [
                    {
                        trip_id: trip.id,
                        seat_ids: seatIds,
                    },
                ],
            };
            const response = await adminBookingService.createBooking(payload);

            if (response.success) {
                toast.success("Đặt vé thành công!");
                onClose(true);
            } else {
                toast.error(response.message || "Đặt vé thất bại. Vui lòng thử lại.");
            }
        } catch (e) {
            const errorMessage =
                e.response?.data?.message ||
                e.response?.data?.errors?.customer_name?.[0] ||
                e.response?.data?.errors?.customer_phone?.[0] ||
                "Có lỗi xảy ra. Vui lòng thử lại.";

            if (e.response?.status === 422) {
                const apiErrors = e.response.data.errors || {};
                Object.keys(apiErrors).forEach((field) => {
                    setError(field, {
                        type: "server",
                        message: apiErrors[field][0],
                    });
                });
            } else {
                toast.error(errorMessage);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="create-booking-modal-overlay" onClick={onClose}>
            <div className="create-booking-modal" onClick={(e) => e.stopPropagation()}>
                <ModalHeader title="Đặt vé cho khách hàng" onClose={onClose} isSubmitting={isSubmitting} />

                <FormProvider {...methods}>
                    <form className="create-booking-modal__body" onSubmit={handleSubmit(onSubmit)}>
                        <div className="create-booking-modal__columns">
                            <div className="create-booking-modal__column">
                                <CustomerInfoSection isSubmitting={isSubmitting} errors={errors} />
                            </div>

                            <div className="create-booking-modal__column">
                                <TripInfoSection
                                    isSubmitting={isSubmitting}
                                    fromSuggestions={fromSuggestions}
                                    toSuggestions={toSuggestions}
                                    focusedLocationField={focusedLocationField}
                                    onLocationFocus={handleLocationFocus}
                                    onLocationBlur={handleLocationBlur}
                                    onLocationSelect={handleLocationSelect}
                                />
                            </div>
                        </div>

                        <ModalFooter onCancel={onClose} isSubmitting={isSubmitting} />
                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default CreateBookingModal;
