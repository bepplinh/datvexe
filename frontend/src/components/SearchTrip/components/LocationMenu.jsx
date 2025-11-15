import React, { useEffect, useMemo, useState, useCallback } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLocation } from "../../../contexts/LocationProvider";
import { useSearchTrip } from "../../../contexts/SearchTripProvider";
import "./LocationMenu.scss";

export default function LocationMenu({ fieldType, excludedLocation, onSelect }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const {
    locationTree,
    expandedIds,
    searchResults,
    loading,
    error,
    rootLocations,
    searchLocations,
    toggleExpand,
  } = useLocation();

  const { setFrom, setTo } = useSearchTrip();

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, searchLocations]);

  const handleLocationClick = useCallback((location) => {
    // Only allow selection for wards (final level)
    if (location.type === "ward") {
      setSelectedId(location.id);
      // Auto set to SearchTripProvider
      if (fieldType === "from") {
        setFrom(location);
      } else if (fieldType === "to") {
        setTo(location);
      }
      // Call parent callback
      if (onSelect) {
        onSelect(location);
      }
    }
  }, [fieldType, setFrom, setTo, onSelect]);

  // Filter out excluded location from tree
  const filterLocationNode = (node) => {
    if (excludedLocation && node.location.id === excludedLocation.id) {
      return null;
    }
    return {
      ...node,
      children: node.children
        .map(filterLocationNode)
        .filter((child) => child !== null),
    };
  };

  const filteredRootLocations = useMemo(() => {
    if (!excludedLocation) return rootLocations;
    return rootLocations
      .map(filterLocationNode)
      .filter((node) => node !== null);
  }, [rootLocations, excludedLocation]);

  // Filter search results
  const filteredSearchResults = useMemo(() => {
    if (!excludedLocation) return searchResults;
    return searchResults.filter(
      (item) => item.id !== excludedLocation.id
    );
  }, [searchResults, excludedLocation]);

  const renderLocationItem = (node, level = 0) => {
    const { location } = node;
    const isExpanded = expandedIds.has(location.id);
    const isSelected = selectedId === location.id;
    
    // Check if location has children (ward never has children)
    const hasChildren = location.type !== "ward" && (node.children.length > 0 || !node.childrenLoaded);
    
    // Only allow selection for wards (final level)
    const canSelect = location.type === "ward";

    // Determine styling based on type and state
    let itemClass = "location-menu__item";
    if (location.type === "city") {
      itemClass += isExpanded ? " location-menu__item--city-selected" : " location-menu__item--city";
    } else if (location.type === "district") {
      itemClass += " location-menu__item--district";
    } else if (location.type === "ward") {
      itemClass += " location-menu__item--ward";
    }

    return (
      <div key={location.id} className="location-menu__tree-item" style={{ paddingLeft: `${level * 20}px` }}>
        <div
          className={itemClass}
          onClick={(e) => {
            e.stopPropagation();
            if (canSelect) {
              handleLocationClick(location);
            } else {
              toggleExpand(location.id, location.type);
            }
          }}
        >
          {location.type === "ward" && (
            <span className="location-menu__bullet location-menu__bullet--ward">•</span>
          )}
          {location.type === "district" && (
            <span className="location-menu__bullet location-menu__bullet--district">•</span>
          )}
          <span className="location-menu__item-text">{location.name}</span>
          {hasChildren && (
            <span className="location-menu__chevron">
              {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </span>
          )}
        </div>
        {isExpanded && node.children.length > 0 && (
          <div className="location-menu__children">
            {node.children.map((childNode) => renderLocationItem(childNode, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const showTree = useMemo(() => search.trim().length === 0, [search]);

  return (
    <div className="location-menu" onMouseDown={(e) => e.preventDefault()}>
      <div className="location-menu__search" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      </div>

      {error && <div className="location-menu__error">{error}</div>}

      {showTree ? (
        <div className="location-menu__tree">
          {loading && filteredRootLocations.length === 0 ? (
            <div className="location-menu__loading">Đang tải...</div>
          ) : (
            filteredRootLocations.map((node) => renderLocationItem(node, 0))
          )}
        </div>
      ) : (
        <div className="location-menu__results">
          {loading ? (
            <div className="location-menu__loading">Đang tìm...</div>
          ) : filteredSearchResults.length === 0 ? (
            <div className="location-menu__empty">Không tìm thấy địa điểm nào</div>
          ) : (
            filteredSearchResults.map((item) => {
              const canSelect = item.type === "ward";
              return (
                <div
                  key={item.id}
                  className={`location-menu__item ${
                    item.type === "ward"
                      ? "location-menu__item--ward"
                      : item.type === "district"
                      ? "location-menu__item--district"
                      : "location-menu__item--city"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canSelect) {
                      onSelect(item);
                    }
                  }}
                  style={{ cursor: canSelect ? "pointer" : "default" }}
                >
                  {item.type === "ward" && (
                    <span className="location-menu__bullet location-menu__bullet--ward">•</span>
                  )}
                  {item.type === "district" && (
                    <span className="location-menu__bullet location-menu__bullet--district">•</span>
                  )}
                  <span className="location-menu__item-text">{item.name}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}