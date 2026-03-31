import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";

import {
  createStore,
  getStores,
  type StoreDto,
} from "../services/stores";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type StaffType as ApiStaffType,
  type UserDto,
} from "../services/users";

type StoreStatus = "Active" | "Needs Attention" | "Setup";

type Store = {
  id: string;
  name: string;
  location: string;
  status: StoreStatus;
  employeeCount: number;
  pendingRequests: number;
  lastUpdated: string;
};

type StaffType = "Regular" | "AllRounder" | "Trainer";

type Employee = {
  id: string;
  name: string;
  email: string;
  staffType: StaffType;
  storeIds: string[];
};

const mapStoreDtoToStore = (store: StoreDto): Store => ({
  id: store.id,
  name: store.name,
  location: store.location,
  status: store.status ?? "Setup",
  employeeCount: store.employeeCount ?? 0,
  pendingRequests: store.pendingRequests ?? 0,
  lastUpdated: store.updatedAtUtc
    ? new Date(store.updatedAtUtc).toLocaleString()
    : "-",
});

const mapUserDtoToEmployee = (user: UserDto): Employee => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  staffType: user.staffType as StaffType,
  storeIds: user.stores?.map((store) => store.id) ?? [],
});

export default function ManagerDashboardPage() {
  const DEFAULT_INITIAL_PASSWORD = "123456";

  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [openAddStore, setOpenAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");

  const [selectedStoreId, setSelectedStoreId] = useState("all");

  // inline edit
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editEmployeeName, setEditEmployeeName] = useState("");
  const [editEmployeeStaffType, setEditEmployeeStaffType] =
    useState<StaffType>("Regular");
  const [editEmployeeStoreIds, setEditEmployeeStoreIds] = useState<string[]>([]);

  // add employee dialog
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeStaffType, setNewEmployeeStaffType] =
    useState<StaffType>("Regular");
  const [newEmployeeStoreIds, setNewEmployeeStoreIds] = useState<string[]>([]);
  const [createEmployeeError, setCreateEmployeeError] = useState("");

  // delete employee dialog
  const [openDeleteEmployee, setOpenDeleteEmployee] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const totalEmployees = useMemo(() => employees.length, [employees]);

  const loadStores = async () => {
    try {
      const data = await getStores();
      setStores(data.map(mapStoreDtoToStore));
    } catch (error) {
      console.error("loadStores error:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getUsers();
      setEmployees(data.map(mapUserDtoToEmployee));
    } catch (error) {
      console.error("loadEmployees error:", error);
    }
  };

  useEffect(() => {
  loadStores();
  loadEmployees();
}, []);

  const filteredEmployees = useMemo(() => {
    if (selectedStoreId === "all") return employees;
    return employees.filter((employee) =>
      employee.storeIds.includes(selectedStoreId)
    );
  }, [employees, selectedStoreId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getStoreNamesByIds = (storeIds: string[]) => {
    return stores
      .filter((store) => storeIds.includes(store.id))
      .map((store) => store.name);
  };

  const handleOpenStoreDashboard = (storeId: string) => {
    navigate(`/manager/stores/${storeId}`);
  };

  const handleAddStore = async () => {
    const trimmedName = newStoreName.trim();
    const trimmedLocation = newStoreLocation.trim();

    if (!trimmedName || !trimmedLocation) return;

    try {
      await createStore({
        name: trimmedName,
        location: trimmedLocation,
      });

      setNewStoreName("");
      setNewStoreLocation("");
      setOpenAddStore(false);

      await loadStores();
    } catch (error) {
      console.error("handleAddStore error:", error);
      alert("Failed to create store.");
    }
  };

  const handleStartEditEmployee = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEditEmployeeName(employee.name);
    setEditEmployeeStaffType(employee.staffType);
    setEditEmployeeStoreIds(employee.storeIds);
  };

  const handleCancelEditEmployee = () => {
    setEditingEmployeeId(null);
    setEditEmployeeName("");
    setEditEmployeeStaffType("Regular");
    setEditEmployeeStoreIds([]);
  };

  const handleConfirmEditEmployee = async () => {
    if (!editingEmployeeId) return;

    const trimmedName = editEmployeeName.trim();

    if (!trimmedName || editEmployeeStoreIds.length === 0) return;

    try {
      await updateUser(editingEmployeeId, {
        fullName: trimmedName,
        role: "Employee",
        staffType: editEmployeeStaffType as ApiStaffType,
        storeIds: editEmployeeStoreIds,
      });

      handleCancelEditEmployee();
      await loadEmployees();
    } catch (error) {
      console.error("handleConfirmEditEmployee error:", error);
      alert("Failed to update employee.");
    }
  };

  const handleOpenAddEmployee = () => {
    setCreateEmployeeError("");
    setOpenAddEmployee(true);
  };

  const handleCloseAddEmployee = () => {
    setOpenAddEmployee(false);
    setNewEmployeeName("");
    setNewEmployeeEmail("");
    setNewEmployeeStaffType("Regular");
    setNewEmployeeStoreIds([]);
    setCreateEmployeeError("");
  };

  const handleCreateEmployee = async () => {
    const trimmedName = newEmployeeName.trim();
    const trimmedEmail = newEmployeeEmail.trim();

    if (!trimmedName || !trimmedEmail || newEmployeeStoreIds.length === 0)
      return;

    try {
      setCreateEmployeeError("");
      await createUser({
        fullName: trimmedName,
        email: trimmedEmail,
        password: DEFAULT_INITIAL_PASSWORD,
        role: "Employee",
        staffType: newEmployeeStaffType as ApiStaffType,
        storeIds: newEmployeeStoreIds,
      });

      handleCloseAddEmployee();
      await loadEmployees();
    } catch (error) {
      console.error("handleCreateEmployee error:", error);
      const responseData = (error as any)?.response?.data;
      const apiError = responseData?.detail || responseData?.message || responseData;
      setCreateEmployeeError(apiError || "Failed to create employee.");
    }
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      await deleteUser(deletingEmployee.id);
      handleCloseDeleteEmployee();
      await loadEmployees();
    } catch (error) {
      console.error("handleConfirmDeleteEmployee error:", error);
      alert("Failed to delete employee.");
    }
  };

  const handleCloseDeleteEmployee = () => {
    setOpenDeleteEmployee(false);
    setDeletingEmployee(null);
  };


  const getStatusChipColor = (status: StoreStatus) => {
    switch (status) {
      case "Active":
        return "success";
      case "Needs Attention":
        return "warning";
      case "Setup":
        return "default";
      default:
        return "default";
    }
  };

  const handleEditStoreIdsChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setEditEmployeeStoreIds(typeof value === "string" ? value.split(",") : value);
  };

  const handleNewEmployeeStoreIdsChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setNewEmployeeStoreIds(typeof value === "string" ? value.split(",") : value);
  };

  const handleOpenDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setOpenDeleteEmployee(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <StorefrontIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                RosterApp
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manager Dashboard
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Box textAlign="right">
              <Typography variant="body1" fontWeight={600}>
                Welcome
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage stores and employees
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage stores and staff from one place.
          </Typography>
        </Box>

        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.light" }}>
                  <StorefrontIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stores
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stores.length}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "success.light" }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {totalEmployees}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Stores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View all stores and open a store dashboard.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddStore(true)}
            >
              Add Store
            </Button>
          </Stack>

          {stores.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                No stores yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add your first store to start managing schedules and employees.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddStore(true)}
              >
                Add Store
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {stores.map((store) => (
                <Grid key={store.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card sx={{ height: "100%", borderRadius: 4, boxShadow: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {store.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {store.location}
                          </Typography>
                        </Box>

                        <Chip
                          label={store.status}
                          color={getStatusChipColor(store.status)}
                          size="small"
                        />
                      </Stack>

                      <Grid container spacing={2} mb={3}>
                        <Grid size={{ xs: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, height: "100%" }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Employees
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                              {store.employeeCount}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, height: "100%" }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Pending Requests
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                              {store.pendingRequests}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, height: "100%" }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Last Updated
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {store.lastUpdated}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleOpenStoreDashboard(store.id)}
                      >
                        Open Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Employees
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage employees across stores.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Store:
                </Typography>
                <Select
                  size="small"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All Stores</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddEmployee}
              >
                Add Employee
              </Button>
            </Stack>
          </Stack>

          {employees.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                No employees yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Employees will appear here after they are added to the system.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 900 }}>
                <Grid
                  container
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Name
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Email
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Stores
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Staff Type
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Actions
                    </Typography>
                  </Grid>
                </Grid>

                {filteredEmployees.length === 0 ? (
                  <Box sx={{ px: 2, py: 4 }}>
                    <Typography color="text.secondary">
                      No employees found for this store.
                    </Typography>
                  </Box>
                ) : (
                  filteredEmployees.map((employee) => {
                    const isEditing = editingEmployeeId === employee.id;

                    return (
                      <Grid
                        container
                        key={employee.id}
                        alignItems="center"
                        sx={{
                          px: 2,
                          py: 2,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Grid size={{ xs: 3 }}>
                          {isEditing ? (
                            <TextField
                              value={editEmployeeName}
                              onChange={(e) => setEditEmployeeName(e.target.value)}
                              size="small"
                              fullWidth
                            />
                          ) : (
                            <Typography fontWeight={600}>{employee.name}</Typography>
                          )}
                        </Grid>

                        <Grid size={{ xs: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {employee.email}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 2 }}>
                          {isEditing ? (
                            <Select
                              multiple
                              size="small"
                              value={editEmployeeStoreIds}
                              onChange={handleEditStoreIdsChange}
                              fullWidth
                              renderValue={(selected) =>
                                stores
                                  .filter((store) =>
                                    (selected as string[]).includes(store.id)
                                  )
                                  .map((store) => store.name)
                                  .join(", ")
                              }
                            >
                              {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                  {store.name}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              {getStoreNamesByIds(employee.storeIds).length > 0 ? (
                                getStoreNamesByIds(employee.storeIds).map((storeName) => (
                                  <Chip key={storeName} label={storeName} size="small" />
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </Stack>
                          )}
                        </Grid>

                        <Grid size={{ xs: 2 }}>
                          {isEditing ? (
                            <Select
                              size="small"
                              value={editEmployeeStaffType}
                              onChange={(e) =>
                                setEditEmployeeStaffType(e.target.value as StaffType)
                              }
                              fullWidth
                            >
                              <MenuItem value="Regular">Regular</MenuItem>
                              <MenuItem value="AllRounder">AllRounder</MenuItem>
                              <MenuItem value="Trainer">Trainer</MenuItem>
                            </Select>
                          ) : (
                            <Typography variant="body2">{employee.staffType}</Typography>
                          )}
                        </Grid>

                        <Grid size={{ xs: 2 }}>
                          {isEditing ? (
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={handleConfirmEditEmployee}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCancelEditEmployee}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          ) : (
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleStartEditEmployee(employee)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleOpenDeleteEmployee(employee)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          )}
                        </Grid>
                      </Grid>
                    );
                  })
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Container>

      <Dialog
        open={openAddStore}
        onClose={() => setOpenAddStore(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Store</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Store Name"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Location"
              value={newStoreLocation}
              onChange={(e) => setNewStoreLocation(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddStore(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddStore}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddEmployee}
        onClose={handleCloseAddEmployee}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {createEmployeeError ? <Alert severity="error">{createEmployeeError}</Alert> : null}

            <TextField
              label="Full Name"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={newEmployeeEmail}
              onChange={(e) => setNewEmployeeEmail(e.target.value)}
              fullWidth
            />

            <Typography variant="body2" color="text.secondary">
              Initial password will be set to: {DEFAULT_INITIAL_PASSWORD}
            </Typography>

            <Select
              multiple
              value={newEmployeeStoreIds}
              onChange={handleNewEmployeeStoreIdsChange}
              fullWidth
              displayEmpty
              renderValue={(selected) => {
                const ids = selected as string[];
                if (ids.length === 0) return "Select Stores";

                return stores
                  .filter((store) => ids.includes(store.id))
                  .map((store) => store.name)
                  .join(", ");
              }}
            >
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={newEmployeeStaffType}
              onChange={(e) =>
                setNewEmployeeStaffType(e.target.value as StaffType)
              }
              fullWidth
            >
              <MenuItem value="Regular">Regular</MenuItem>
              <MenuItem value="AllRounder">AllRounder</MenuItem>
              <MenuItem value="Trainer">Trainer</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddEmployee}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateEmployee}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteEmployee}
        onClose={handleCloseDeleteEmployee}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {deletingEmployee?.name || "this employee"}
            </Box>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteEmployee}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteEmployee}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
