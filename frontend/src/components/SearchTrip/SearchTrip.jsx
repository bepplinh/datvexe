import React, { useState, useRef, useEffect } from "react";
import "./SearchTrip.scss";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import date_picker from "../../assets/date_picker.svg";
import SearchIcon from "@mui/icons-material/Search";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";
import { useSearchTrip } from "../../contexts/SearchTripProvider";
import { useNavigate } from "react-router-dom";

const sampleLocations = [
    "Hà Nội",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Nha Trang",
    "Huế",
    "Phú Quốc",
];

const formatDate = (date) => {
    if (!date) return "DD/MM/YYYY";
    if (dayjs.isDayjs(date)) {
        return date.format("DD/MM/YYYY");
    }
    return dayjs(date).format("DD/MM/YYYY");
};

const SearchTrip = () => {
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
    const departDateFieldRef = useRef(null);
    const returnDateFieldRef = useRef(null);

    const navigate = useNavigate();

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

    const swapLocations = () => {
        setFrom(to);
        setTo(from);
    };

    dayjs.extend(updateLocale);

    dayjs.updateLocale("vi", {
        weekStart: 1, // 1 = Monday
    });

    dayjs.locale("vi");

    const minDate = dayjs();
    const maxDate = dayjs().add(6, "month");

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <div ref={containerRef} className="search-trip">
                {/* Trip type radio */}
                <div className="search-trip__trip-type">
                    <label className="search-trip__trip-type-option">
                        <input
                            type="radio"
                            value="oneway"
                            checked={tripType === "oneway"}
                            onChange={() => {
                                setTripType("oneway");
                                setOpenDropdown(null);
                                setReturnDate(null);
                            }}
                        />
                        <span>Một chiều</span>
                    </label>
                    <label className="search-trip__trip-type-option">
                        <input
                            type="radio"
                            value="roundtrip"
                            checked={tripType === "roundtrip"}
                            onChange={() => setTripType("roundtrip")}
                        />
                        <span>Khứ hồi</span>
                    </label>
                </div>

                {/* Search bar */}
                <div className="search-trip__bar">
                    {/* Container điểm đi, điểm đến + nút đổi vị trí */}
                    <div className="search-trip__locations">
                        {/* Điểm đi */}
                        <div
                            className="search-trip__field search-trip__field--location"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "from" ? null : "from"
                                )
                            }
                        >
                            <LocationOnIcon className="search-trip__icon" />
                            <div className="search-trip__label-small">
                                Điểm đi
                            </div>
                            <div className="search-trip__value">
                                {from || "Chọn điểm đi"}
                            </div>

                            {openDropdown === "from" && (
                                <div className="search-trip__dropdown">
                                    {sampleLocations.map((loc) => (
                                        <div
                                            key={loc}
                                            className={`search-trip__dropdown-item ${
                                                loc === from
                                                    ? "search-trip__dropdown-item--active"
                                                    : ""
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFrom(loc);
                                                setOpenDropdown(null);
                                            }}
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            {loc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Button đổi vị trí */}
                        <button
                            type="button"
                            aria-label="Đổi vị trí"
                            className="search-trip__swap-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                swapLocations();
                            }}
                        >
                            ⇄
                        </button>

                        {/* Điểm đến */}
                        <div
                            className="search-trip__field search-trip__field--location"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "to" ? null : "to"
                                )
                            }
                        >
                            <LocationOnIcon className="search-trip__icon" />
                            <div className="search-trip__label-small">
                                Điểm đến
                            </div>
                            <div className="search-trip__value">
                                {to || "Chọn điểm đến"}
                            </div>

                            {openDropdown === "to" && (
                                <div className="search-trip__dropdown">
                                    {sampleLocations.map((loc) => (
                                        <div
                                            key={loc}
                                            className={`search-trip__dropdown-item ${
                                                loc === to
                                                    ? "search-trip__dropdown-item--active"
                                                    : ""
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTo(loc);
                                                setOpenDropdown(null);
                                            }}
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            {loc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ngày đi */}
                    <div className="search-trip__date-field-wrapper">
                        <div
                            ref={departDateFieldRef}
                            className="search-trip__date-field"
                            onClick={() => setOpenDepartDatePicker(true)}
                        >
                            <img
                                src={date_picker}
                                alt="calendar"
                                className="search-trip__calendar-icon"
                            />
                            <div className="search-trip__date-content">
                                <div className="search-trip__label-small">
                                    Ngày đi
                                </div>
                                <div className="search-trip__date-value">
                                    {formatDate(departDate)}
                                </div>
                            </div>
                        </div>
                        <DesktopDatePicker
                            value={departDate}
                            onChange={(newValue) => {
                                setDepartDate(newValue);
                                if (
                                    returnDate &&
                                    newValue &&
                                    dayjs(returnDate).isBefore(newValue)
                                ) {
                                    setReturnDate(null);
                                }
                            }}
                            minDate={minDate}
                            maxDate={maxDate}
                            open={openDepartDatePicker}
                            onOpen={() => setOpenDepartDatePicker(true)}
                            onClose={() => setOpenDepartDatePicker(false)}
                            enableAccessibleFieldDOMStructure={false}
                            slots={{
                                textField: (params) => (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width:
                                                departDateFieldRef.current
                                                    ?.offsetWidth || "180px",
                                            height:
                                                departDateFieldRef.current
                                                    ?.offsetHeight || "70px",
                                            pointerEvents: "none",
                                            opacity: 0,
                                        }}
                                    >
                                        <input
                                            {...params.inputProps}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                            }}
                                        />
                                    </div>
                                ),
                            }}
                            slotProps={{
                                popper: {
                                    placement: "bottom-start",
                                    anchorEl: openDepartDatePicker
                                        ? departDateFieldRef.current
                                        : null,
                                    sx: {
                                        zIndex: 1000,
                                    },
                                },
                                textField: {
                                    sx: {
                                        "& .MuiInputBase-root": {
                                            fontFamily: "Lexend",
                                        },
                                    },
                                },
                            }}
                            localeText={{
                                calendarWeekNumberHeaderText: "Tuần",
                                calendarWeekNumberHeaderLabel: "Số tuần",
                                calendarWeekNumberAriaLabel: (weekNumber) =>
                                    `Tuần ${weekNumber}`,
                                calendarWeekNumberText: (weekNumber) =>
                                    `${weekNumber}`,
                            }}
                        />
                    </div>

                    {/* Ngày về */}
                    <div
                        className={`search-trip__date-field-wrapper ${
                            tripType === "roundtrip"
                                ? "search-trip__date-field-wrapper--active"
                                : "search-trip__date-field-wrapper--disabled"
                        }`}
                    >
                        <div
                            ref={returnDateFieldRef}
                            className="search-trip__date-field"
                            onClick={() =>
                                tripType === "roundtrip" &&
                                setOpenReturnDatePicker(true)
                            }
                        >
                            <img
                                src={date_picker}
                                alt="calendar"
                                className="search-trip__calendar-icon"
                            />
                            <div className="search-trip__date-content">
                                <div className="search-trip__label-small">
                                    Ngày về
                                </div>
                                <div className="search-trip__date-value">
                                    {formatDate(returnDate)}
                                </div>
                            </div>
                        </div>
                        <DesktopDatePicker
                            value={returnDate}
                            onChange={(newValue) => setReturnDate(newValue)}
                            minDate={departDate || minDate}
                            maxDate={maxDate}
                            disabled={tripType !== "roundtrip"}
                            open={
                                openReturnDatePicker && tripType === "roundtrip"
                            }
                            onOpen={() =>
                                tripType === "roundtrip" &&
                                setOpenReturnDatePicker(true)
                            }
                            onClose={() => setOpenReturnDatePicker(false)}
                            enableAccessibleFieldDOMStructure={false}
                            slots={{
                                textField: (params) => (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width:
                                                returnDateFieldRef.current
                                                    ?.offsetWidth || "180px",
                                            height:
                                                returnDateFieldRef.current
                                                    ?.offsetHeight || "70px",
                                            pointerEvents: "none",
                                            opacity: 0,
                                        }}
                                    >
                                        <input
                                            {...params.inputProps}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                            }}
                                        />
                                    </div>
                                ),
                            }}
                            slotProps={{
                                popper: {
                                    placement: "bottom-start",
                                    anchorEl:
                                        openReturnDatePicker &&
                                        tripType === "roundtrip"
                                            ? returnDateFieldRef.current
                                            : null,
                                    sx: {
                                        zIndex: 1000,
                                    },
                                },
                                textField: {
                                    sx: {
                                        "& .MuiInputBase-root": {
                                            fontFamily: "Lexend",
                                        },
                                    },
                                },
                            }}
                            localeText={{
                                calendarWeekNumberHeaderText: "Tuần",
                                calendarWeekNumberHeaderLabel: "Số tuần",
                                calendarWeekNumberAriaLabel: (weekNumber) =>
                                    `Tuần ${weekNumber}`,
                                calendarWeekNumberText: (weekNumber) =>
                                    `${weekNumber}`,
                            }}
                        />
                    </div>

                    {/* Nút tìm kiếm */}
                    <button
                        className="search-trip__submit"
                        type="button"
                        onClick={() => navigate("/trip")}
                    >
                        <SearchIcon sx={{ fontSize: "16px" }} />
                        <span>Tìm Kiếm</span>
                    </button>
                </div>
            </div>
        </LocalizationProvider>
    );
};

export default SearchTrip;
