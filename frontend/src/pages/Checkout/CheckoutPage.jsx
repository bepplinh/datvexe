import React, { useState } from "react";
import MainLayout from "../../layout/MainLayout/MainLayout";
import "./CheckoutPage.scss";
import Steps from "./Steps/Steps";

export default function CheckoutPage() {
  const [name, setName] = useState("Lê Đức Anh");
  const [country, setCountry] = useState("+84");
  const [phone, setPhone] = useState("0849568136");
  const [note, setNote] = useState("");
  const [pickup, setPickup] = useState("tòa nhà sóng đà, đường phạm hùng");
  const [dropoff, setDropoff] = useState("");

  return (
    <MainLayout>
      <div className="checkout">
        <div className="checkout__grid">
          <aside className="checkout__summary">
            <div className="summary__card">
              <div className="summary__title">Vé của bạn</div>
              <div className="summary__section">
                <div className="summary__label" style={{ fontWeight: 600 }}>Chiều đi</div>
                <div className="summary__date">15/11/2025</div>
              </div>
              <div className="summary__route">BX Giáp Bát - Thọ Xuân</div>
              <div className="summary__details">
                <div className="summary__row">
                  <span>Khởi hành</span>
                  <span>05:30</span>
                </div>
                <div className="summary__row">
                  <span>Biển số xe</span>
                  <span>36C-24519</span>
                </div>
                <div className="summary__row">
                  <span>Số ghế/giường</span>
                  <span className="seat_label">A8,A9</span>
                </div>
                <div className="summary__row">
                  <span style={{ fontWeight: 600 }}>Giá vé:</span>
                  <span>
                    <span className="price">A8: 180.000 đ</span>
                  </span>
                </div>
                <div className="summary__row">
                  <span />
                  <span className="price">A9: 180.000 đ</span>
                </div>
              </div>
              <div className="summary__total">
                <div className="summary__row">
                  <span>Tổng thanh toán</span>
                  <span className="price">360.000 đ</span>
                </div>
                <div className="summary__row">
                  <span style={{ fontWeight: 600 }}>Tổng tiền</span>
                  <span className="price">360.000 đ</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="checkout__content">
            <div className="stepContainer">
              <Steps></Steps>
            </div>

            <div className="card">
              <div className="card__title">Thông tin liên hệ</div>
              <div className="form">
                <div className="form__row">
                  <div className="form__field form__field--half">
                    <label>Họ tên *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
                <div className="form__row">
                  <div className="form__field form__field--half">
                    <label>Số điện thoại *</label>
                    <div className="phone">
                      <select value={country} onChange={(e) => setCountry(e.target.value)}>
                        <option value="+84">(VN) +84</option>
                        <option value="+1">+1</option>
                        <option value="+65">+65</option>
                      </select>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="form__field form__field--half">
                    <label>Ghi chú</label>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" />
                  </div>
                </div>
                <div className="form__row">
                  <div className="form__field form__field--half">
                    <label>NHẬP ĐIỂM ĐÓN CHI TIẾT</label>
                    <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="tòa nhà sóng đà, đường phạm hùng" />
                  </div>
                  <div className="form__field form__field--half">
                    <label>NHẬP ĐIỂM TRẢ CHI TIẾT</label>
                    <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Điểm trả chi tiết" />
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout__actions">
              <div className="checkout__button">
                <button type="button" className="btn btn--primary">Tiếp tục →</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
