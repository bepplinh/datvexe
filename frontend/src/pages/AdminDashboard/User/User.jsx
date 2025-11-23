import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
// 1. Import thêm các component UI
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Stack from "@mui/material/Stack";

// Các hàm xử lý sự kiện (Có thể đưa vào trong component nếu cần state)
const handleEdit = (id) => {
    console.log(`Đang chỉnh sửa User có ID: ${id}`);
    // Logic mở modal sửa hoặc điều hướng
};

const handleDelete = (id) => {
    if (window.confirm(`Bạn có chắc muốn xóa User ID: ${id}?`)) {
        console.log(`Đang xóa User có ID: ${id}`);
        // Logic gọi API xóa
    }
};

const columns = [
    { field: "id", headerName: "ID", width: 90 },
    {
        field: "firstName",
        headerName: "First name",
        width: 150,
        editable: true,
    },
    {
        field: "lastName",
        headerName: "Last name",
        width: 150,
        editable: true,
    },
    {
        field: "age",
        headerName: "Age",
        type: "number",
        width: 110,
        editable: true,
    },
    {
        field: "fullName",
        headerName: "Full name",
        description: "This column has a value getter and is not sortable.",
        sortable: false,
        width: 160,
        valueGetter: (value, row) =>
            `${row.firstName || ""} ${row.lastName || ""}`,
    },
    // 2. Thêm cột Action tại đây
    {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false, // Không cho phép sắp xếp cột này
        disableClickEventBubbling: true,
        renderCell: (params) => {
            return (
                <Stack direction="row" spacing={1}>
                    <IconButton
                        color="primary"
                        aria-label="edit"
                        onClick={() => handleEdit(params.row.id)} // Lấy ID từ params.row
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        aria-label="delete"
                        onClick={() => handleDelete(params.row.id)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Stack>
            );
        },
    },
];

const rows = [
    { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
    { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
    { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
    { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
    { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
    { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
    { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
    { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
    { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
];

function Users() {
    return (
        <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 5,
                        },
                    },
                }}
                pageSizeOptions={[5]}
                checkboxSelection
                disableRowSelectionOnClick
            />
        </Box>
    );
}

export default Users;
