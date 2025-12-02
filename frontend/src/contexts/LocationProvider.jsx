import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
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
    const isMountedRef = useRef(true);
    const hasInitializedRef = useRef(false);
    const initializingRef = useRef(false);
    const lastFieldTypeRef = useRef(null);

    // Kiểm tra xem có đang ở trang admin không (sử dụng window.location vì Provider nằm ngoài Router)
    const isAdminRoute =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin");

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
        // Tránh gọi API nhiều lần cùng lúc
        if (initializingRef.current || hasInitializedRef.current) {
            return;
        }

        initializingRef.current = true;
        hasInitializedRef.current = true;

        try {
            if (isMountedRef.current) {
                setLoading(true);
                setError(null);
            }
            const cities = await locationService.getCities();

            if (!isMountedRef.current) return;

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
            if (isMountedRef.current) {
                setError(err.message || "Không thể tải danh sách địa điểm");
            }
        } finally {
            initializingRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
            }
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
            const results = await locationService.searchLocations(keyword);
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
    const toggleExpand = useCallback((locationId, locationType) => {
        setExpandedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(locationId)) {
                newSet.delete(locationId);
            } else {
                newSet.add(locationId);
            }
            return newSet;
        });
    }, []);

    /**
     * Reset expandedIds to close all nodes in the tree
     * Also tracks fieldType to reset when switching between "from" and "to"
     */
    const resetExpandedIds = useCallback((fieldType) => {
        // Only reset if fieldType is provided and different from last one
        if (fieldType) {
            if (lastFieldTypeRef.current !== null && lastFieldTypeRef.current !== fieldType) {
                // FieldType changed, reset tree only if there are expanded nodes
                setExpandedIds((prev) => {
                    if (prev.size > 0) {
                        return new Set();
                    }
                    return prev; // Return same reference to avoid unnecessary re-render
                });
                // Only update lastFieldTypeRef when we actually reset
                lastFieldTypeRef.current = fieldType;
            } else if (lastFieldTypeRef.current === null) {
                // First time opening a menu, just track the fieldType without resetting
                lastFieldTypeRef.current = fieldType;
            }
            // If fieldType is the same as last one, do nothing (don't update ref or reset)
        } else {
            // If no fieldType provided, just reset (for manual reset)
            setExpandedIds((prev) => {
                if (prev.size > 0) {
                    return new Set();
                }
                return prev;
            });
        }
    }, []);

    /**
     * Get root locations (cities)
     */
    const rootLocations = React.useMemo(
        () =>
            Object.values(locationTree).filter(
                (node) => !node.location.parent_id
            ),
        [locationTree]
    );

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Initialize tree on mount - chỉ gọi một lần và chỉ khi không ở trang admin
    useEffect(() => {
        // Kiểm tra route hiện tại
        const currentPath =
            typeof window !== "undefined" ? window.location.pathname : "";
        const isAdmin = currentPath.startsWith("/admin");

        // Không gọi API nếu đang ở trang admin
        if (isAdmin) {
            return;
        }

        if (!hasInitializedRef.current) {
            initializeTree();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy một lần khi mount

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
        resetExpandedIds,
        setError,
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
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
