import {
  Alert,
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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createNextRosterWeek,
  getRosterWeeks,
  type RosterWeek,
} from "../services/rosterWeeks";
import { getStores, type StoreDto, type StoreStatus } from "../services/stores";
import { getUsers, type UserDto } from "../services/users";

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card sx={{ height: "100%", borderRadius: 4, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatLocalDateTimeInput(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localDateTimeToUtcIso(localDateTimeValue: string): string {
  return new Date(localDateTimeValue).toISOString();
}

function getStoreStatusChipColor(status: StoreStatus) {
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
}

export default function StoreDashboardPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const [store, setStore] = useState<StoreDto | null>(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeError, setStoreError] = useState("");

  const [rosterWeeks, setRosterWeeks] = useState<RosterWeek[]>([]);
  const [loadingRosterWeeks, setLoadingRosterWeeks] = useState(false);
  const [rosterWeeksError, setRosterWeeksError] = useState("");

  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [availabilityCloseAtLocal, setAvailabilityCloseAtLocal] = useState("");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const fetchStore = async () => {
    if (!storeId) return;

    try {
      setLoadingStore(true);
      setStoreError("");

      const stores = await getStores();
      const matchedStore = stores.find((item) => item.id === storeId) ?? null;

      setStore(matchedStore);

      if (!matchedStore) {
        setStoreError("Store not found.");
      }
    } catch (error: any) {
      console.error("Failed to fetch store:", error);
      setStoreError(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load store details."
      );
    } finally {
      setLoadingStore(false);
    }
  };

  const fetchRosterWeeks = async () => {
    if (!storeId) return;

    try {
      setLoadingRosterWeeks(true);
      setRosterWeeksError("");
      const data = await getRosterWeeks(storeId);
      setRosterWeeks(data);
    } catch (error: any) {
      console.error("Failed to fetch roster weeks:", error);
      setRosterWeeksError(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load roster weeks."
      );
    } finally {
      setLoadingRosterWeeks(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError("");

      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      setUsersError(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!storeId) return;

    fetchStore();
    fetchRosterWeeks();
    fetchUsers();
  }, [storeId]);

  const handleBackToManager = () => {
    navigate("/manager");
  };

  const handleViewAvailability = () => {
    console.log("View availability for store:", storeId);
  };

  const handleOpenRosterEditor = () => {
    console.log("Open roster editor for store:", storeId);
  };

  const handleOpenPublishAvailabilityDialog = () => {
    const defaultClose = new Date();
    defaultClose.setDate(defaultClose.getDate() + 2);
    defaultClose.setHours(18, 0, 0, 0);

    setAvailabilityCloseAtLocal(formatLocalDateTimeInput(defaultClose));
    setPublishError("");
    setOpenPublishDialog(true);
  };

  const handlePublishAvailabilityCollection = async () => {
    if (!storeId) return;

    try {
      setPublishLoading(true);
      setPublishError("");

      await createNextRosterWeek(storeId, {
        availabilityCloseAtUtc: localDateTimeToUtcIso(availabilityCloseAtLocal),
      });

      setOpenPublishDialog(false);
      setAvailabilityCloseAtLocal("");
      await fetchRosterWeeks();
    } catch (error: any) {
      setPublishError(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to publish availability collection."
      );
    } finally {
      setPublishLoading(false);
    }
  };

  const totalStaff = storeId
  ? users.filter((user) =>
      user.stores.some((store) => store.id === storeId)
    ).length
  : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button variant="text" onClick={handleBackToManager}>
            Back to Manager Dashboard
          </Button>

          <Typography variant="body2" color="text.secondary">
            Store ID: {storeId ?? "N/A"}
          </Typography>
        </Stack>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {loadingStore ? "Loading store..." : store?.name ?? "Store Dashboard"}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1 }}
                  flexWrap="wrap"
                  alignItems="center"
                >
                  <Typography variant="body1" color="text.secondary">
                    {store?.location ?? "Store details not loaded yet"}
                  </Typography>

                  {store?.status ? (
                    <Chip
                      label={store.status}
                      color={getStoreStatusChipColor(store.status)}
                      size="small"
                    />
                  ) : null}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Manage availability collection and roster workflow for this store.
                </Typography>

                {storeError ? (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {storeError}
                  </Typography>
                ) : null}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained" onClick={handleOpenPublishAvailabilityDialog}>
                  Publish Availability Collection
                </Button>

                <Button variant="outlined" onClick={handleViewAvailability}>
                  View Availability
                </Button>

                <Button variant="contained" onClick={handleOpenRosterEditor}>
                  Edit Next Week Roster
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Availability Collection Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track published roster weeks and submission deadlines.
                </Typography>
              </Box>

              <Button variant="contained" onClick={handleOpenPublishAvailabilityDialog}>
                Publish New Collection
              </Button>
            </Stack>

            {rosterWeeksError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {rosterWeeksError}
              </Alert>
            ) : null}

            {loadingRosterWeeks ? (
              <Typography variant="body2" color="text.secondary">
                Loading roster weeks...
              </Typography>
            ) : rosterWeeks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No roster week has been published for this store yet.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {rosterWeeks.map((week) => (
                  <Paper key={week.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {week.weekStartDate} to {week.weekEndDate}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Status: {week.status}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Availability opens at{" "}
                          {new Date(week.availabilityOpenAtUtc).toLocaleString()}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Availability closes at{" "}
                          {new Date(week.availabilityCloseAtUtc).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Staff"
              value={loadingUsers ? "..." : String(totalStaff)}
              subtitle={usersError ? "Failed to load staff" : "Employees assigned to this store"}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Pending Requests"
              value={store?.pendingRequests != null ? String(store.pendingRequests) : "-"}
              subtitle="From store summary"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Roster Weeks"
              value={String(rosterWeeks.length)}
              subtitle="Published for this store"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Latest Updated"
              value={
                store?.updatedAtUtc
                  ? new Date(store.updatedAtUtc).toLocaleDateString()
                  : "-"
              }
              subtitle="Store record update"
            />
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Next Week Roster Preview
            </Typography>

            <Typography variant="body2" color="text.secondary">
              This section is not connected yet. It will show daily roster preview once
              the roster editor and shift data APIs are ready.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Attention Needed
            </Typography>

            <Typography variant="body2" color="text.secondary">
              This section is not connected yet. It will show missing availability,
              conflicts, and understaffed shifts later.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Quick Actions
            </Typography>

            <Stack spacing={2}>
              <Button variant="outlined" fullWidth disabled>
                Copy Last Week
              </Button>

              <Button variant="outlined" fullWidth disabled>
                Auto-fill from Availability
              </Button>

              <Button variant="outlined" fullWidth disabled>
                Create Shift
              </Button>

              <Button variant="outlined" fullWidth disabled>
                Publish Schedule
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              This Week Snapshot
            </Typography>

            <Typography variant="body2" color="text.secondary">
              This section is not connected yet. It will show current shift snapshot and
              pending changes later.
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={openPublishDialog}
        onClose={() => setOpenPublishDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Publish Availability Collection for Next Week</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Choose when employee availability submissions will close.
            </Typography>

            <TextField
              label="Availability Close Time"
              type="datetime-local"
              value={availabilityCloseAtLocal}
              onChange={(e) => setAvailabilityCloseAtLocal(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {publishError ? <Alert severity="error">{publishError}</Alert> : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPublishDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePublishAvailabilityCollection}
            disabled={publishLoading || !availabilityCloseAtLocal}
          >
            {publishLoading ? "Publishing..." : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}