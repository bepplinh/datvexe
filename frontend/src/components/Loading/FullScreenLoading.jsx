// src/components/Loading/FullScreenLoading.jsx
import { Backdrop, CircularProgress } from "@mui/material";

export default function FullScreenLoading({ open = true }) {
    return (
        <Backdrop
            open={open}
            sx={{
                color: "#000", // màu của spinner (đen) – bạn thích thì để lại "#fff" cũng được
                bgcolor: "rgba(0,0,0,0.15)", // nền đen mờ, nhìn thấy được đằng sau
                zIndex: (theme) => theme.zIndex.modal + 1,
            }}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
    );
}
