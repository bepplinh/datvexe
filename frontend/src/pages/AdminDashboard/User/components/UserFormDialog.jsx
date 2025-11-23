import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import { Loader2, UserPlus, Settings } from "lucide-react";
import dayjs from "dayjs";

const UserFormDialog = ({ open, onClose, user, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        birthday: "",
        gender: "",
        role: "user",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                birthday: user.birthday
                    ? dayjs(user.birthday).format("YYYY-MM-DD")
                    : "",
                gender: user.gender || "",
                role: user.role || "user",
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                birthday: "",
                gender: "",
                role: "user",
            });
        }
        setErrors({});
    }, [user, open]);

    const handleChange = (field) => (event) => {
        const value = event?.target?.value ?? event;
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = "Tên không được để trống";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống";
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))) {
            newErrors.phone = "Số điện thoại không hợp lệ";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const submitData = {
            ...formData,
            birthday: formData.birthday || null,
        };

        onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Settings className="h-5 w-5 text-blue-600" />
                            </div>
                        ) : (
                            <div className="p-2 bg-green-100 rounded-lg">
                                <UserPlus className="h-5 w-5 text-green-600" />
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                {user
                                    ? "Chỉnh sửa người dùng"
                                    : "Thêm người dùng mới"}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                {user
                                    ? "Cập nhật thông tin người dùng bên dưới."
                                    : "Điền thông tin để tạo người dùng mới."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-semibold">
                            Tên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={handleChange("name")}
                            placeholder="Nhập tên đầy đủ"
                            disabled={loading}
                            className={`h-11 text-base ${
                                errors.name
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                            }`}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive font-medium">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="email"
                            className="text-sm font-semibold"
                        >
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange("email")}
                            placeholder="example@email.com"
                            disabled={loading || !!user}
                            className={`h-11 text-base ${
                                errors.email
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                            }`}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive font-medium">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="phone"
                            className="text-sm font-semibold"
                        >
                            Số điện thoại{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange("phone")}
                            placeholder="0123456789"
                            disabled={loading}
                            className={`h-11 text-base ${
                                errors.phone
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                            }`}
                        />
                        {errors.phone && (
                            <p className="text-sm text-destructive font-medium">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="birthday"
                                className="text-sm font-semibold"
                            >
                                Ngày sinh
                            </Label>
                            <Input
                                id="birthday"
                                type="date"
                                value={formData.birthday}
                                onChange={handleChange("birthday")}
                                max={dayjs().format("YYYY-MM-DD")}
                                disabled={loading}
                                className="h-11 text-base"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="gender"
                                className="text-sm font-semibold"
                            >
                                Giới tính
                            </Label>
                            <Select
                                value={formData.gender}
                                onValueChange={handleChange("gender")}
                                disabled={loading}
                            >
                                <SelectTrigger
                                    id="gender"
                                    className="h-11 text-base"
                                >
                                    <SelectValue placeholder="Chọn giới tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        Chọn giới tính
                                    </SelectItem>
                                    <SelectItem value="male">Nam</SelectItem>
                                    <SelectItem value="female">Nữ</SelectItem>
                                    <SelectItem value="other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role" className="text-sm font-semibold">
                            Vai trò
                        </Label>
                        <Select
                            value={formData.role}
                            onValueChange={handleChange("role")}
                            disabled={loading}
                        >
                            <SelectTrigger id="role" className="h-11 text-base">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Người dùng</SelectItem>
                                <SelectItem value="admin">
                                    Quản trị viên
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 sm:flex-initial h-11"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 sm:flex-initial h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    >
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {user ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserFormDialog;
