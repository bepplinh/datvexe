import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import locationService from "../services/locationService";

const LocationContext = createContext(null);

/**
 * Location Provider - Manages location tree structure and search state
 */
export const LocationProvider = ({ children }) => {
  // Tree structure: { [id]: { location, children: [], expanded: boolean, childrenLoaded: boolean } }
  const [locationTree, setLocationTree] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Recursively build tree node from location data with children
   */
  const buildTreeNode = useCallback((location) => {
    const children = location.children || [];
    return {
      location: {
        id: location.id,
        name: location.name,
        type: location.type,
        parent_id: location.parent_id,
      },
      children: children.map((child) => buildTreeNode(child)),
      expanded: false,
      childrenLoaded: true, // All children are already loaded from API
    };
  }, []);

  /**
   * Initialize location tree with cities (all children already included from API)
   */
  const initializeTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cities = await locationService.getCities();

      const tree = {};
      cities.forEach((city) => {
        const node = buildTreeNode(city);
        tree[city.id] = node;
        // Also add all nested children to tree for easy access
        const addChildrenToTree = (node) => {
          node.children.forEach((childNode) => {
            tree[childNode.location.id] = childNode;
            addChildrenToTree(childNode);
          });
        };
        addChildrenToTree(node);
      });

      setLocationTree(tree);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách địa điểm");
    } finally {
      setLoading(false);
    }
  }, [buildTreeNode]);


  /**
   * Search locations by keyword
   */
  const searchLocations = useCallback(async (keyword) => {
    if (!keyword || !keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("LocationProvider: Searching for:", keyword);
      const results = await locationService.searchLocations(keyword);
      console.log("LocationProvider: Search results:", results);
      setSearchResults(results || []);
    } catch (err) {
      console.error("LocationProvider: Search error:", err);
      setError(err.message || "Không thể tìm kiếm địa điểm");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle expand/collapse for a location
   * All children are already loaded from API, so we just toggle the expanded state
   */
  const toggleExpand = useCallback(
    (locationId, locationType) => {
      setExpandedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(locationId)) {
          newSet.delete(locationId);
        } else {
          newSet.add(locationId);
        }
        return newSet;
      });
    },
    []
  );

  /**
   * Get root locations (cities)
   */
  const rootLocations = React.useMemo(
    () => Object.values(locationTree).filter((node) => !node.location.parent_id),
    [locationTree]
  );

  // Initialize tree on mount
  useEffect(() => {
    initializeTree();
  }, [initializeTree]);

  const value = {
    // State
    locationTree,
    expandedIds,
    searchResults,
    loading,
    error,
    rootLocations,

    // Actions
    initializeTree,
    searchLocations,
    toggleExpand,
    setError,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

/**
 * Hook to use Location context
 */
export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
};

