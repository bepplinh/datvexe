import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import "./SearchButton.scss";

const SearchButton = ({ onClick }) => {
    return (
        <button
            className="search-button"
            type="button"
            onClick={onClick}
        >
            <SearchIcon sx={{ fontSize: "16px" }} />
            <span>Tìm Kiếm</span>
        </button>
    );
};

export default SearchButton;

