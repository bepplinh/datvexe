import MainLayout from "../../layout/MainLayout/MainLayout";
import SearchTrip from "../../components/SearchTrip/SearchTrip";
import TripFilter from "../../components/TripFilter/TripFilter";
import TripDate from "../../components/TripDate/TripDate";
import "./Trip.scss";

function Trip() {
    return (
        <>
            <div className="search">
                <MainLayout>
                    <SearchTrip></SearchTrip>
                </MainLayout>
            </div>

            <MainLayout>
                <div className="trip-container">
                    <div className="trip-fillter">
                        <TripFilter />
                    </div>
                    <div className="trip-info">
                        <div className="trip-date">
                            <TripDate
                                title="Chọn chiều đi"
                                subtitle="Thọ Xuân - BX Giáp Bát | Ngày 16/11/2025"
                                arrow="right"
                            />
                            <TripDate
                                title="Chọn chiều về"
                                subtitle="BX Giáp Bát - Thọ Xuân | Ngày 18/11/2025"
                                arrow="left"
                                dim
                            />
                        </div>
                        <div className="trip-way"></div>
                        <div className="trip-content"></div>
                    </div>
                </div>
            </MainLayout>
        </>
    );
}

export default Trip;
