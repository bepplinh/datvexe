import { useState, useEffect } from "react";
import axiosClient from "../../apis/axiosClient";
import ProfileUpdateForm from "./ProfileUpdateForm";
import "./Profile.scss";
import { toast } from "react-toastify";

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        try {
            const res = await axiosClient.get("/info");
            setProfile(res.data);
        } catch (e) {
            toast.error("Đã có lỗi xảy ra !");
            setError("Không tải được thông tin hồ sơ. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateSuccess = (resData) => {
        if (resData?.data) {
            setProfile(resData.data);
        }
        fetchProfile();
    };

    return (
        <div className="profile-page">
            <h1 className="profile-page__title">Thông tin cá nhân</h1>
            <p className="profile-page__subtitle">
                Cập nhật thông tin tài khoản của bạn.
            </p>

            {loading && (
                <div className="profile-page__loading">
                    Đang tải thông tin...
                </div>
            )}

            {error && !loading && (
                <div className="profile-page__error">{error}</div>
            )}

            {!loading && profile && (
                <div className="profile-page__card">
                    <ProfileUpdateForm
                        initialData={profile}
                        onSuccess={handleUpdateSuccess}
                    />
                </div>
            )}
        </div>
    );
}

export default Profile;
