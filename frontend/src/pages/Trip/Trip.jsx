import { useMemo } from "react";
import dayjs from "dayjs";
import MainLayout from "../../layout/MainLayout/MainLayout";
import SearchTrip from "../../components/SearchTrip/SearchTrip";
import TripFilter from "./TripFilter/TripFilter";
import TripDate from "./TripDate/TripDate";
import TripList from "./TripList/TripList";
import TripSelectedTickets from "./TripSelectedTickets/TripSelectedTickets";
import "./Trip.scss";
import { useSearchTrip } from "../../contexts/SearchTripProvider";
import { toast } from "react-toastify";
import {
    ActiveTabWayProvider,
    useActiveTabWay,
} from "../../contexts/ActiveTabWayProvider";
import { TripFilterProvider } from "../../contexts/TripFilterProvider";

function TripContent() {
    const { results, handleSearchTrip } = useSearchTrip();

    const { isActiveTabWay, setIsActiveTabWay } = useActiveTabWay();

    const onSubmit = async () => {
        const result = await handleSearchTrip();
        if (!result.success) {
            toast.warning(result.message);
            return;
        }
    };

    const tripDateItems = useMemo(() => {
        if (!results) return [];

        const formatSubtitle = (trip) => {
            const from = trip?.from_location || "Điểm đi";
            const to = trip?.to_location || "Điểm đến";
            const dayLabel = trip?.day
                ? dayjs(trip.day).format("DD/MM/YYYY")
                : "Chưa xác định";
            return `${from} - ${to} | Ngày ${dayLabel}`;
        };

        const items = [];

        if (Array.isArray(results.outbound) && results.outbound.length > 0) {
            items.push({
                id: "outboundTrip",
                title: "Chọn chiều đi",
                subtitle: formatSubtitle(results.outbound[0]),
                arrow: "right",
            });
        }

        if (Array.isArray(results.return) && results.return.length > 0) {
            items.push({
                id: "returnTrip",
                title: "Chọn chiều về",
                subtitle: formatSubtitle(results.return[0]),
                arrow: "left",
            });
        }

        return items;
    }, [results]);

    return (
        <>
            <div className="search">
                <MainLayout>
                    <SearchTrip onSubmit={onSubmit} />
                </MainLayout>
            </div>

            <MainLayout>
                <div className="trip-container">
                    <div className="trip-fillter">
                        <TripFilter />
                        <TripSelectedTickets />
                    </div>
                    <div className="trip-info">
                        {results && tripDateItems.length > 0 && (
                            <div className="trip-date">
                                {tripDateItems.map((item) => (
                                    <TripDate
                                        key={item.id}
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        arrow={item.arrow}
                                        dim={
                                            tripDateItems.length > 1 &&
                                            isActiveTabWay !== item.id
                                        }
                                        onClick={() => {
                                            setIsActiveTabWay(item.id);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="trip-content">
                            <TripList activeTab={isActiveTabWay} />
                        </div>
                    </div>
                </div>
            </MainLayout>
        </>
    );
}

function Trip() {
    return (
        <ActiveTabWayProvider>
            <TripFilterProvider>
                <TripContent />
            </TripFilterProvider>
        </ActiveTabWayProvider>
    );
}

export default Trip;
