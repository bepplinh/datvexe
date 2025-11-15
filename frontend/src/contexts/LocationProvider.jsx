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
   * Initialize location tree with cities
   */
  const initializeTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cities = await locationService.getCities();

      const tree = {};
      cities.forEach((city) => {
        const children = city.children || [];
        tree[city.id] = {
          location: city,
          children: children.map((child) => ({
            location: child,
            children: [],
            expanded: false,
            childrenLoaded: false,
          })),
          expanded: false,
          childrenLoaded: children.length > 0,
        };
      });

      setLocationTree(tree);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách địa điểm");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load children for a parent location
   */
  const loadChildren = useCallback(async (parentId, parentType) => {
    try {
      setLoading(true);
      setError(null);
      const children = await locationService.getChildren(parentId, parentType);

      setLocationTree((prev) => {
        // Deep clone function
        const cloneNode = (node) => ({
          ...node,
          children: node.children ? node.children.map(cloneNode) : [],
        });

        // Clone all nodes
        const updated = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = cloneNode(prev[key]);
        });

        // Create child nodes
        const childNodes = children.map((child) => {
          const childNode = {
            location: child,
            children: [],
            expanded: false,
            childrenLoaded: false,
          };
          // Also add to root level for easy access
          updated[child.id] = childNode;
          return childNode;
        });

        // Helper function to recursively find and update node
        const findAndUpdateNode = (nodes, targetId) => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.location.id === targetId) {
              // Found the node, create new node with updated children
              nodes[i] = {
                ...node,
                children: childNodes,
                childrenLoaded: true,
              };
              return true;
            }
            // Recursively search in children
            if (node.children && node.children.length > 0) {
              if (findAndUpdateNode(node.children, targetId)) {
                return true;
              }
            }
          }
          return false;
        };

        // First check root level
        if (updated[parentId]) {
          updated[parentId] = {
            ...updated[parentId],
            children: childNodes,
            childrenLoaded: true,
          };
        } else {
          // Search in all root nodes' children recursively
          const rootNodes = Object.values(updated);
          findAndUpdateNode(rootNodes, parentId);
        }

        return updated;
      });
    } catch (err) {
      setError(err.message || "Không thể tải danh sách con");
      console.error("Error loading children:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search locations by keyword
   */
  const searchLocations = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await locationService.searchLocations(keyword);
      setSearchResults(results);
    } catch (err) {
      setError(err.message || "Không thể tìm kiếm địa điểm");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle expand/collapse for a location
   */
  const toggleExpand = useCallback(
    (locationId, locationType) => {
      setExpandedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(locationId)) {
          newSet.delete(locationId);
        } else {
          newSet.add(locationId);
          // Load children if not loaded yet
          let node = locationTree[locationId];

          // If not found at root, search recursively in children
          if (!node) {
            for (const key in locationTree) {
              const rootNode = locationTree[key];
              if (rootNode.children) {
                const found = rootNode.children.find(
                  (child) => child.location.id === locationId
                );
                if (found) {
                  node = found;
                  break;
                }
              }
            }
          }

          if (node && !node.childrenLoaded && locationType !== "ward") {
            loadChildren(locationId, locationType);
          }
        }
        return newSet;
      });
    },
    [locationTree, loadChildren]
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
    loadChildren,
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

