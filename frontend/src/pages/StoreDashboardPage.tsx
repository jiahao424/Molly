import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

type DashboardStats = {
  totalStaff: number;
  availabilitySubmitted: number;
  totalStaffExpected: number;
  unassignedShifts: number;
  scheduledHours: number;
};

type AlertItem = {
  id: string;
  message: string;
  severity: "warning" | "error" | "info";
};

type DayPreview = {
  dayName: string;
  dateLabel: string;
  shiftCount: number;
  unassignedCount: number;
  hasConflict: boolean;
};

type SnapshotItem = {
  label: string;
  value: string;
};

type StoreDashboardData = {
  store: {
    id: string;
    name: string;
    location: string;
    status: "Open" | "Closed" | "Setup";
    weekLabel: string;
  };
  stats: DashboardStats;
  alerts: AlertItem[];
  nextWeekPreview: DayPreview[];
  snapshot: SnapshotItem[];
};

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

function AlertLevelChip({
  severity,
}: {
  severity: AlertItem["severity"];
}) {
  if (severity === "error") {
    return <Chip label="High" color="error" size="small" />;
  }

  if (severity === "warning") {
    return <Chip label="Medium" color="warning" size="small" />;
  }

  return <Chip label="Info" color="info" size="small" />;
}

function getStoreStatusChipColor(status: StoreDashboardData["store"]["status"]) {
  switch (status) {
    case "Open":
      return "success";
    case "Closed":
      return "default";
    case "Setup":
      return "warning";
    default:
      return "default";
  }
}

const mockStoreDashboards: Record<string, StoreDashboardData> = {
  "store-1": {
    store: {
      id: "store-1",
      name: "Chatswood Store",
      location: "Sydney NSW",
      status: "Open",
      weekLabel: "23 Mar - 29 Mar",
    },
    stats: {
      totalStaff: 18,
      availabilitySubmitted: 12,
      totalStaffExpected: 18,
      unassignedShifts: 5,
      scheduledHours: 126,
    },
    alerts: [
      {
        id: "1",
        message: "3 employees have not submitted availability for next week.",
        severity: "warning",
      },
      {
        id: "2",
        message: "Friday dinner shift is understaffed.",
        severity: "error",
      },
      {
        id: "3",
        message: "1 scheduled shift conflicts with approved leave.",
        severity: "info",
      },
    ],
    nextWeekPreview: [
      {
        dayName: "Mon",
        dateLabel: "23 Mar",
        shiftCount: 4,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Tue",
        dateLabel: "24 Mar",
        shiftCount: 5,
        unassignedCount: 1,
        hasConflict: false,
      },
      {
        dayName: "Wed",
        dateLabel: "25 Mar",
        shiftCount: 4,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Thu",
        dateLabel: "26 Mar",
        shiftCount: 5,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Fri",
        dateLabel: "27 Mar",
        shiftCount: 7,
        unassignedCount: 2,
        hasConflict: false,
      },
      {
        dayName: "Sat",
        dateLabel: "28 Mar",
        shiftCount: 8,
        unassignedCount: 0,
        hasConflict: true,
      },
      {
        dayName: "Sun",
        dateLabel: "29 Mar",
        shiftCount: 6,
        unassignedCount: 0,
        hasConflict: false,
      },
    ],
    snapshot: [
      { label: "On shift now", value: "Alice Chen, Kevin Wang" },
      { label: "Next shift starts", value: "5:00 PM" },
      { label: "Shift changes pending", value: "2 requests" },
    ],
  },
  "store-2": {
    store: {
      id: "store-2",
      name: "Burwood Store",
      location: "Sydney NSW",
      status: "Open",
      weekLabel: "23 Mar - 29 Mar",
    },
    stats: {
      totalStaff: 11,
      availabilitySubmitted: 9,
      totalStaffExpected: 11,
      unassignedShifts: 2,
      scheduledHours: 84,
    },
    alerts: [
      {
        id: "1",
        message: "2 employees still need to submit availability.",
        severity: "warning",
      },
      {
        id: "2",
        message: "Saturday lunch shift still needs one more staff member.",
        severity: "info",
      },
    ],
    nextWeekPreview: [
      {
        dayName: "Mon",
        dateLabel: "23 Mar",
        shiftCount: 3,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Tue",
        dateLabel: "24 Mar",
        shiftCount: 3,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Wed",
        dateLabel: "25 Mar",
        shiftCount: 4,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Thu",
        dateLabel: "26 Mar",
        shiftCount: 4,
        unassignedCount: 0,
        hasConflict: false,
      },
      {
        dayName: "Fri",
        dateLabel: "27 Mar",
        shiftCount: 5,
        unassignedCount: 1,
        hasConflict: false,
      },
      {
        dayName: "Sat",
        dateLabel: "28 Mar",
        shiftCount: 5,
        unassignedCount: 1,
        hasConflict: false,
      },
      {
        dayName: "Sun",
        dateLabel: "29 Mar",
        shiftCount: 4,
        unassignedCount: 0,
        hasConflict: false,
      },
    ],
    snapshot: [
      { label: "On shift now", value: "Jenny Chen, Tomy" },
      { label: "Next shift starts", value: "4:30 PM" },
      { label: "Shift changes pending", value: "1 request" },
    ],
  },
};

const fallbackDashboard: StoreDashboardData = {
  store: {
    id: "unknown",
    name: "Unknown Store",
    location: "Unknown Location",
    status: "Setup",
    weekLabel: "23 Mar - 29 Mar",
  },
  stats: {
    totalStaff: 0,
    availabilitySubmitted: 0,
    totalStaffExpected: 0,
    unassignedShifts: 0,
    scheduledHours: 0,
  },
  alerts: [
    {
      id: "1",
      message: "No dashboard data found for this store yet.",
      severity: "info",
    },
  ],
  nextWeekPreview: [
    {
      dayName: "Mon",
      dateLabel: "23 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Tue",
      dateLabel: "24 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Wed",
      dateLabel: "25 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Thu",
      dateLabel: "26 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Fri",
      dateLabel: "27 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Sat",
      dateLabel: "28 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
    {
      dayName: "Sun",
      dateLabel: "29 Mar",
      shiftCount: 0,
      unassignedCount: 0,
      hasConflict: false,
    },
  ],
  snapshot: [
    { label: "On shift now", value: "-" },
    { label: "Next shift starts", value: "-" },
    { label: "Shift changes pending", value: "0 requests" },
  ],
};

export default function StoreDashboardPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const dashboardData = useMemo(() => {
    if (!storeId) {
      return fallbackDashboard;
    }

    return mockStoreDashboards[storeId] ?? {
      ...fallbackDashboard,
      store: {
        ...fallbackDashboard.store,
        id: storeId,
      },
    };
  }, [storeId]);

  const handleBackToManager = () => {
    navigate("/manager");
  };

  const handleOpenRosterEditor = () => {
    console.log("Open roster editor for store:", storeId);
  };

  const handleViewAvailability = () => {
    console.log("View availability for store:", storeId);
  };

  const handleOpenFullEditor = () => {
    console.log("Open full editor for store:", storeId);
  };

  const handleCopyLastWeek = () => {
    console.log("Copy last week for store:", storeId);
  };

  const handleAutoFill = () => {
    console.log("Auto-fill shifts for store:", storeId);
  };

  const handleCreateShift = () => {
    console.log("Create shift for store:", storeId);
  };

  const handlePublishSchedule = () => {
    console.log("Publish schedule for store:", storeId);
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
                  {dashboardData.store.name}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <Typography variant="body1" color="text.secondary">
                    {dashboardData.store.location}
                  </Typography>

                  <Chip
                    label={dashboardData.store.status}
                    color={getStoreStatusChipColor(dashboardData.store.status)}
                    size="small"
                  />

                  <Chip
                    label={`Week of ${dashboardData.store.weekLabel}`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Staff"
              value={String(dashboardData.stats.totalStaff)}
              subtitle="Active employees in this store"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Availability Submitted"
              value={`${dashboardData.stats.availabilitySubmitted}/${dashboardData.stats.totalStaffExpected}`}
              subtitle="For next week"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Unassigned Shifts"
              value={String(dashboardData.stats.unassignedShifts)}
              subtitle="Still need coverage"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Scheduled Hours"
              value={`${dashboardData.stats.scheduledHours}h`}
              subtitle="Planned for next week"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: "100%", borderRadius: 4, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Next Week Roster Preview
                  </Typography>

                  <Button size="small" onClick={handleOpenFullEditor}>
                    Open Full Editor
                  </Button>
                </Stack>

                <Grid container spacing={2}>
                  {dashboardData.nextWeekPreview.map((day) => (
                    <Grid
                      key={`${day.dayName}-${day.dateLabel}`}
                      size={{ xs: 12, sm: 6, md: 4 }}
                    >
                      <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {day.dayName}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {day.dateLabel}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="body2">
                              Shifts: <strong>{day.shiftCount}</strong>
                            </Typography>

                            <Typography variant="body2">
                              Unassigned: <strong>{day.unassignedCount}</strong>
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                              {day.unassignedCount > 0 ? (
                                <Chip
                                  label="Needs Coverage"
                                  color="warning"
                                  size="small"
                                />
                              ) : (
                                <Chip label="Covered" color="success" size="small" />
                              )}

                              {day.hasConflict ? (
                                <Chip label="Conflict" color="error" size="small" />
                              ) : null}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Attention Needed
                  </Typography>

                  <List disablePadding>
                    {dashboardData.alerts.map((alert, index) => (
                      <Box key={alert.id}>
                        <ListItem
                          disableGutters
                          secondaryAction={<AlertLevelChip severity={alert.severity} />}
                        >
                          <ListItemText primary={alert.message} />
                        </ListItem>

                        {index < dashboardData.alerts.length - 1 ? <Divider /> : null}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>

                  <Stack spacing={2}>
                    <Button variant="contained" fullWidth onClick={handleCopyLastWeek}>
                      Copy Last Week
                    </Button>

                    <Button variant="outlined" fullWidth onClick={handleAutoFill}>
                      Auto-fill from Availability
                    </Button>

                    <Button variant="outlined" fullWidth onClick={handleCreateShift}>
                      Create Shift
                    </Button>

                    <Button variant="outlined" fullWidth onClick={handlePublishSchedule}>
                      Publish Schedule
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              This Week Snapshot
            </Typography>

            <Grid container spacing={2}>
              {dashboardData.snapshot.map((item) => (
                <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>

                    <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}