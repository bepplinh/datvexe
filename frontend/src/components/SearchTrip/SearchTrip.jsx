import React, { useState, useRef, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useSearchTrip } from "../../contexts/SearchTripProvider";
import TripTypeSelector from "./components/TripTypeSelector";
import LocationField from "./components/LocationField";
import LocationSwapButton from "./components/LocationSwapButton";
import DateField from "./components/DateField";
import SearchButton from "./components/SearchButton";
import { getMinDate, getMaxDate } from "./utils/dateUtils";
import "./SearchTrip.scss";

const SearchTrip = ({ onSubmit }) => {
    const {
        tripType,
        setTripType,
        from,
        setFrom,
        to,
        setTo,
        departDate,
        setDepartDate,
        returnDate,
        setReturnDate,
    } = useSearchTrip();

    const [openDropdown, setOpenDropdown] = useState(null); // 'from', 'to' hoặc null
    const [openDepartDatePicker, setOpenDepartDatePicker] = useState(false);
    const [openReturnDatePicker, setOpenReturnDatePicker] = useState(false);

    const containerRef = useRef(null);
    const locationsContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTripTypeChange = (newTripType) => {
        setTripType(newTripType);
        setOpenDropdown(null);
        if (newTripType === "oneway") {
            setReturnDate(null);
        }
    };

    const handleSwapLocations = () => {
        setFrom(to);
        setTo(from);
    };

    const handleDepartDateChange = (newValue) => {
        setDepartDate(newValue);
        if (
            returnDate &&
            newValue &&
            dayjs(returnDate).isBefore(newValue)
        ) {
            setReturnDate(null);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <div ref={containerRef} className="search-trip">
                <TripTypeSelector
                    tripType={tripType}
                    onTripTypeChange={handleTripTypeChange}
                />

                <div className="search-trip__bar">
                    <div
                        ref={locationsContainerRef}
                        className="search-trip__locations"
                    >
                        <LocationField
                            label="Điểm đi"
                            value={from}
                            fieldType="from"
                            excludedLocation={to}
                            isOpen={openDropdown === "from"}
                            onToggle={() =>
                                setOpenDropdown(
                                    openDropdown === "from" ? null : "from"
                                )
                            }
                            onSelect={(location) => {
                                setOpenDropdown(null);
                            }}
                        />

                        <LocationSwapButton onSwap={handleSwapLocations} />

                        <LocationField
                            label="Điểm đến"
                            value={to}
                            fieldType="to"
                            excludedLocation={from}
                            isOpen={openDropdown === "to"}
                            onToggle={() =>
                                setOpenDropdown(
                                    openDropdown === "to" ? null : "to"
                                )
                            }
                            onSelect={(location) => {
                                setOpenDropdown(null);
                            }}
                        />
                    </div>

                    <DateField
                        label="Ngày đi"
                        value={departDate}
                        onChange={handleDepartDateChange}
                        minDate={getMinDate()}
                        maxDate={getMaxDate()}
                        isOpen={openDepartDatePicker}
                        onOpen={() => setOpenDepartDatePicker(true)}
                        onClose={() => setOpenDepartDatePicker(false)}
                    />

                    <DateField
                        label="Ngày về"
                        value={returnDate}
                        onChange={setReturnDate}
                        minDate={departDate || getMinDate()}
                        maxDate={getMaxDate()}
                        isOpen={openReturnDatePicker}
                        onOpen={() =>
                            tripType === "roundtrip" &&
                            setOpenReturnDatePicker(true)
                        }
                        onClose={() => setOpenReturnDatePicker(false)}
                        disabled={tripType !== "roundtrip"}
                    />

                    <SearchButton onClick={onSubmit} />
                </div>
            </div>
        </LocalizationProvider>
    );
};

export default SearchTrip;
