# Trip Booking Flow (Frontend)

Tài liệu này mô tả nhanh các phần chính trong FE liên quan đến tìm chuyến,
hiển thị chuyến, chọn chuyến và đặt ghế.

## 1. Tìm chuyến (`SearchTripProvider` + `SearchTrip`)

-   `SearchTripProvider` (`src/contexts/SearchTripProvider.jsx`) giữ trạng thái form
    tìm kiếm (điểm đi/đến, ngày, loại vé một chiều/khứ hồi).
-   Hàm `handleSearchTrip`:
    -   Validate input, tự điền ngày mặc định nếu thiếu.
    -   Gọi API `POST /client/trips/search` thông qua `searchTripsApi`
        (`src/services/tripService.js`).
    -   Lưu `results` (gồm `outbound` và, nếu có, `return`) để các component khác
        dùng.
-   Component `SearchTrip` hiển thị form, khi submit thì gọi
    `handleSearchTrip`.

## 2. Hiển thị kết quả (`Trip` page)

-   Trang `Trip` (`src/pages/Trip/Trip.jsx`) bọc bằng các provider:
    `SearchTripProvider`, `TripFilterProvider`, `ActiveTabWayProvider`,
    `BookingProvider`.
-   `TripDate` cho biết đang chọn chiều đi/về; `ActiveTabWayProvider` lưu trạng
    thái tab hiện tại.
-   `TripList` nhận `activeTab`, lọc dữ liệu theo các tiêu chí trong
    `TripFilterProvider`, và render danh sách `TripInfo`.
-   `TripSelectedTickets` nằm dưới khối bộ lọc; hiển thị ghế đã chọn (nếu là
    khứ hồi) và cho phép giữ chỗ khi đủ hai chiều.

## 3. Chọn chuyến (`TripInfo` + `BookSeat`)

-   `TripInfo` hiển thị card thông tin chuyến, chứa nút “Đặt vé”.
-   Khi bấm nút:
    -   Mở modal `BookSeat`.
    -   `BookSeat` tải sơ đồ ghế (`SeatMap`), cho phép chọn ghế.
    -   Nếu kết quả hiện tại có cả hai chiều:
        -   `BookSeat` không gọi API lock ngay mà dùng `BookingProvider.savePendingSelection`
            để lưu ghế tạm cho leg tương ứng (OUT/RETURN), sau đó đóng modal.
    -   Nếu chỉ có một chiều:
        -   `BookSeat` gọi API `/checkout/lock-seats`, nhận `draft_id` và điều hướng
            tới `/checkout`.

## 4. Giữ ghế cho vé khứ hồi (`BookingProvider` + `TripSelectedTickets`)

-   `BookingProvider` (`src/contexts/BookingProvider.jsx`):
    -   Xác định leg OUT/RETURN thông qua `getTripLeg`.
    -   Lưu `pendingSelections` gồm thông tin trip và ghế cho từng leg.
    -   Cung cấp `savePendingSelection` và `clearPendingSelections`.
-   `TripSelectedTickets` đọc `pendingSelections` và render UI giống thiết kế:
    -   Mỗi leg hiển thị đường đi, giờ, ghế, giá.
    -   Khi cả hai leg có dữ liệu, nút CTA gọi `/checkout/lock-seats` cho cả hai
        trip, sau đó chuyển đến `/checkout`.

## 5. Checkout

-   Route `/checkout` hiện tại chỉ hiển thị UI mẫu trong
    `src/pages/Checkout/CheckoutPage.jsx`.
    Khi hoàn tất flow giữ ghế (một chiều hoặc khứ hồi), người dùng được đưa tới
    trang này cùng `draft_id` trên query string để xử lý tiếp (tích hợp sau).

## Mối liên hệ component/chức năng chính

| Thành phần              | Vai trò chính                                     |
| ----------------------- | ------------------------------------------------- |
| `SearchTripProvider`    | Lưu trạng thái form, gọi API tìm chuyến           |
| `TripFilterProvider`    | Bộ lọc danh sách chuyến                           |
| `ActiveTabWayProvider`  | Trạng thái tab chiều đi/về                        |
| `BookingProvider`       | Ghi nhận ghế tạm thời cho từng leg, hỗ trợ lock   |
| `TripList` / `TripInfo` | Render kết quả và mở modal đặt ghế                |
| `BookSeat`              | Chọn ghế, gọi lock hoặc lưu tạm                   |
| `TripSelectedTickets`   | Hiển thị ghế đã chọn, lock cả hai leg cho khứ hồi |
| `CheckoutPage`          | Bước tiếp theo sau khi lock thành công            |

Tài liệu này tập trung vào FE; logic giữ ghế thực tế nằm ở API
`/checkout/lock-seats` phía backend.
