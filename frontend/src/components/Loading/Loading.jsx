import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";

export default function CircularIndeterminate() {
    return (
        <Box sx={{ display: "flex" }}>
            <CircularProgress />
        </Box>
    );
}
