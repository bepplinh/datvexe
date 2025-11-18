import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import "./SearchButton.scss";
import { useSearchTrip } from "../../../contexts/SearchTripProvider";

const SearchButton = ({ onClick }) => {
    const { loading } = useSearchTrip();

    return (
        <button
            className={`search-button ${loading ? "is-loading" : ""}`}
            type="button"
            onClick={onClick}
            disabled={loading}
        >
            {loading ? <div className="spinner"></div> : <SearchIcon />}
            <span>Tìm Kiếm</span>
        </button>
    );
};

export default SearchButton;
