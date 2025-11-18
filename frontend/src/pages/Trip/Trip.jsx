import MainLayout from "../../layout/MainLayout/MainLayout";
import SearchTrip from "../../components/SearchTrip/SearchTrip";
import TripFilter from "./TripFilter/TripFilter";
import TripDate from "./TripDate/TripDate";
import TripList from "./TripList/TripList";
import "./Trip.scss";
import { useSearchTrip } from "../../contexts/SearchTripProvider";
import { toast } from "react-toastify";
import { dataTripDate } from "./TripDate/data";
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
                    </div>
                    <div className="trip-info">
                        {results && (
                            <div className="trip-date">
                                {dataTripDate
                                    .filter((item) => {
                                        if (item.id === "outboundTrip") {
                                            return (
                                                results.outbound &&
                                                results.outbound.length > 0
                                            );
                                        }
                                        if (item.id === "returnTrip") {
                                            return (
                                                results.return &&
                                                results.return.length > 0
                                            );
                                        }
                                        return false;
                                    })
                                    .map((item, index, array) => {
                                        return (
                                            <TripDate
                                                key={item.id || index}
                                                title={item.title}
                                                subtitle={item.subtitle}
                                                arrow={item.arrow}
                                                dim={
                                                    array.length > 1 &&
                                                    isActiveTabWay !== item.id
                                                }
                                                onClick={() => {
                                                    setIsActiveTabWay(item.id);
                                                }}
                                            />
                                        );
                                    })}
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
