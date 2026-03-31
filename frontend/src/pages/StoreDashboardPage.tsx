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
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createNextRosterWeek,
  getRosterWeeks,
  type RosterWeek,
} from "../services/rosterWeeks";
import {
  getRosterWeekAvailabilitySubmissions,
  type RosterWeekAvailabilitySubmissionResponse,
} from "../services/rosterWeekDetail";
import { getStores, type StoreDto, type StoreStatus } from "../services/stores";
import { getUsers, type UserDto } from "../services/users";

type ExtendedRosterWeek = RosterWeek & {
  availabilitySubmissionCount?: number;
  rosterPublishedAtUtc?: string | null;
};

const HISTORY_PAGE_SIZE = 6;

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

function formatDateRange(week: ExtendedRosterWeek) {
  return `${week.weekStartDate} - ${week.weekEndDate}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
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

function isCollectionStillOpen(week: ExtendedRosterWeek) {
  return new Date(week.availabilityCloseAtUtc).getTime() > Date.now();
}

function hasRosterBeenGenerated(week: ExtendedRosterWeek) {
  return Boolean(week.publishedAtUtc || week.rosterPublishedAtUtc || week.status === "Published");
}

function getCollectionStateLabel(week: ExtendedRosterWeek) {
  if (hasRosterBeenGenerated(week)) return "Roster ready";
  if (isCollectionStillOpen(week)) return "Collecting availability";
  return "Collection closed";
}

function HistoryRow({
  week,
  onViewAvailability,
  onViewRoster,
}: {
  week: ExtendedRosterWeek;
  onViewAvailability: (week: ExtendedRosterWeek) => void;
  onViewRoster: (week: ExtendedRosterWeek) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {formatDateRange(week)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {getCollectionStateLabel(week)}
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={() => onViewAvailability(week)}>
            View Availability
          </Button>
          <Button variant="outlined" onClick={() => onViewRoster(week)}>
            View Week Roster
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function StoreDashboardPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const [store, setStore] = useState<StoreDto | null>(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeError, setStoreError] = useState("");

  const [rosterWeeks, setRosterWeeks] = useState<ExtendedRosterWeek[]>([]);
  const [loadingRosterWeeks, setLoadingRosterWeeks] = useState(false);
  const [rosterWeeksError, setRosterWeeksError] = useState("");

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [availabilityCloseAtLocal, setAvailabilityCloseAtLocal] = useState("");

  const [historyPage, setHistoryPage] = useState(1);
  const [currentWeekSubmissions, setCurrentWeekSubmissions] = useState<
    RosterWeekAvailabilitySubmissionResponse[]
  >([]);
  const [loadingCurrentWeekSubmissions, setLoadingCurrentWeekSubmissions] =
    useState(false);
  const [currentWeekSubmissionsError, setCurrentWeekSubmissionsError] = useState("");

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
      setRosterWeeks(data as ExtendedRosterWeek[]);
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

  const totalStaff = useMemo(() => {
    if (!storeId) return 0;
    return users.filter((user) => user.stores.some((store) => store.id === storeId)).length;
  }, [storeId, users]);

  const sortedWeeks = useMemo(() => {
    return [...rosterWeeks].sort((a, b) => {
      return new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime();
    });
  }, [rosterWeeks]);

  const currentOpenCollection = useMemo(() => {
    return sortedWeeks.find((week) => isCollectionStillOpen(week) && !hasRosterBeenGenerated(week)) ?? null;
  }, [sortedWeeks]);

  const activePreRosterWeek = useMemo(() => {
    return sortedWeeks.find((week) => !hasRosterBeenGenerated(week)) ?? null;
  }, [sortedWeeks]);

  const historyWeeks = useMemo(() => {
    return sortedWeeks.filter((week) => {
      if (currentOpenCollection?.id === week.id) return false;
      if (activePreRosterWeek?.id === week.id) return false;
      return true;
    });
  }, [sortedWeeks, currentOpenCollection, activePreRosterWeek]);

  const pagedHistoryWeeks = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return historyWeeks.slice(start, start + HISTORY_PAGE_SIZE);
  }, [historyPage, historyWeeks]);

  const historyPageCount = Math.max(1, Math.ceil(historyWeeks.length / HISTORY_PAGE_SIZE));

  const completionCount = currentWeekSubmissions.length;
  const completionText = totalStaff > 0 ? `${completionCount}/${totalStaff}` : `${completionCount}/0`;

  useEffect(() => {
    const fetchCurrentWeekSubmissions = async () => {
      if (!storeId || !currentOpenCollection) {
        setCurrentWeekSubmissions([]);
        setCurrentWeekSubmissionsError("");
        return;
      }

      try {
        setLoadingCurrentWeekSubmissions(true);
        setCurrentWeekSubmissionsError("");

        const data = await getRosterWeekAvailabilitySubmissions(
          storeId,
          currentOpenCollection.id
        );

        setCurrentWeekSubmissions(data);
      } catch (error: any) {
        console.error("Failed to fetch current week submissions:", error);
        setCurrentWeekSubmissions([]);
        setCurrentWeekSubmissionsError(
          error?.response?.data?.message ||
            error?.response?.data ||
            "Failed to load current week submissions."
        );
      } finally {
        setLoadingCurrentWeekSubmissions(false);
      }
    };

    fetchCurrentWeekSubmissions();
  }, [storeId, currentOpenCollection]);

  const handleBackToManager = () => {
    navigate("/manager");
  };

  const handleViewAvailability = (week?: ExtendedRosterWeek | null) => {
    if (!storeId) return;
    if (week) {
      navigate(`/manager/stores/${storeId}/roster-weeks/${week.id}/availability`);
      return;
    }
    navigate(`/manager/stores/${storeId}/availability`);
  };

  const handleOpenRosterEditor = (week?: ExtendedRosterWeek | null) => {
    if (!storeId) return;
    if (week) {
      navigate(`/manager/stores/${storeId}/roster-weeks/${week.id}/edit`);
      return;
    }
    navigate(`/manager/stores/${storeId}/roster/edit-next-week`);
  };

  const handleViewWeekRoster = (week: ExtendedRosterWeek) => {
    if (!storeId) return;
    navigate(`/manager/stores/${storeId}/roster-weeks/${week.id}/roster`);
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
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Current Availability Collection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only the current active collection stays here. Expired ones move to history.
                </Typography>
              </Box>

              {rosterWeeksError ? <Alert severity="error">{rosterWeeksError}</Alert> : null}
              {usersError ? <Alert severity="warning">{usersError}</Alert> : null}

              {loadingRosterWeeks ? (
                <Typography variant="body2" color="text.secondary">
                  Loading roster weeks...
                </Typography>
              ) : !currentOpenCollection ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        No active collection for next week
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        There is currently no published availability request for the upcoming week.
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button variant="contained" onClick={handleOpenPublishAvailabilityDialog}>
                        Publish New Collection
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {formatDateRange(currentOpenCollection)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Collection closes at {formatDateTime(currentOpenCollection.availabilityCloseAtUtc)}
                        </Typography>
                      </Box>

                      <Chip label={getCollectionStateLabel(currentOpenCollection)} color="primary" />
                    </Stack>

                    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "grey.50" }}>
                      <Typography variant="body2" color="text.secondary">
                        Availability progress
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {loadingCurrentWeekSubmissions ? "Loading..." : completionText}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Submitted employees / total store staff
                      </Typography>
                      {currentWeekSubmissionsError ? (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          {currentWeekSubmissionsError}
                        </Typography>
                      ) : null}
                    </Paper>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button
                        variant="outlined"
                        onClick={() => handleViewAvailability(currentOpenCollection)}
                      >
                        View Availability
                      </Button>

                      <Button
                        variant="contained"
                        onClick={() => handleOpenRosterEditor(currentOpenCollection)}
                      >
                        Edit Next Week Roster
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
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
                  History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Historical availability collections and published week rosters.
                </Typography>
              </Box>
            </Stack>

            {loadingRosterWeeks ? (
              <Typography variant="body2" color="text.secondary">
                Loading history...
              </Typography>
            ) : historyWeeks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No historical records yet.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {pagedHistoryWeeks.map((week) => (
                  <HistoryRow
                    key={week.id}
                    week={week}
                    onViewAvailability={handleViewAvailability}
                    onViewRoster={handleViewWeekRoster}
                  />
                ))}

                <Stack alignItems="center" sx={{ pt: 1 }}>
                  <Pagination
                    count={historyPageCount}
                    page={historyPage}
                    onChange={(_, value) => setHistoryPage(value)}
                    color="primary"
                  />
                </Stack>
              </Stack>
            )}
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
