import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getDraftById } from "../services/draftService";

/**
 * Custom hook để quản lý việc fetch và state của draft checkout
 * @param {string|null} draftId - ID của draft từ URL params
 * @returns {object} { draftData, isLoading, error, refetch }
 */
export function useDraft(draftId) {
    const [draftData, setDraftData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDraft = useCallback(async () => {
        if (!draftId) {
            setDraftData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await getDraftById(draftId);

        if (result.success) {
            setDraftData(result.data);
            setError(null);
        } else {
            setDraftData(null);
            setError(result.message);
            toast.error(result.message);
        }

        setIsLoading(false);
    }, [draftId]);

    useEffect(() => {
        let cancelled = false;

        const loadDraft = async () => {
            await fetchDraft();
        };

        loadDraft();

        return () => {
            cancelled = true;
        };
    }, [fetchDraft]);

    return {
        draftData,
        isLoading,
        error,
        refetch: fetchDraft,
    };
}
