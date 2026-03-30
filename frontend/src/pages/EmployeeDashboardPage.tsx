import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getStoredUser } from "../services/authService";
import {
  getOpenRosterWeeks,
  type OpenRosterWeekItem,
} from "../services/rosterWeekDetail";

function getAvailabilityChipColor(hasSubmission: boolean) {
  return hasSubmission ? "info" : "warning";
}

function formatWeekLabel(weekStartDate: string, weekEndDate: string) {
  return `${weekStartDate} - ${weekEndDate}`;
}

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [openAvailabilities, setOpenAvailabilities] = useState<OpenRosterWeekItem[]>([]);
  const [loadingOpenAvailabilities, setLoadingOpenAvailabilities] = useState(false);
  const [openAvailabilitiesError, setOpenAvailabilitiesError] = useState("");

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleOpenAvailability = (storeId: string, rosterWeekId: string) => {
    navigate(`/employee/stores/${storeId}/availability/${rosterWeekId}`);
  };

  useEffect(() => {
    const fetchOpenAvailabilities = async () => {
      try {
        setLoadingOpenAvailabilities(true);
        setOpenAvailabilitiesError("");

        const data = await getOpenRosterWeeks();
        setOpenAvailabilities(data);
      } catch (error: any) {
        console.error("Failed to fetch open availabilities:", error);
        setOpenAvailabilitiesError(
          error?.response?.data?.message ||
            error?.response?.data ||
            "Failed to load open availabilities."
        );
      } finally {
        setLoadingOpenAvailabilities(false);
      }
    };

    fetchOpenAvailabilities();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Employee Dashboard
            </Typography>
            <Typography color="text.secondary">
              Welcome, {user?.fullName}
            </Typography>
          </Box>

          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, boxShadow: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Open Availability
                  </Typography>
                  <Chip
                    label={
                      loadingOpenAvailabilities
                        ? "Loading..."
                        : `${openAvailabilities.length} Open`
                    }
                    color="primary"
                    size="small"
                  />
                </Stack>

                {openAvailabilitiesError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {openAvailabilitiesError}
                  </Alert>
                ) : null}

                <Stack spacing={2}>
                  {loadingOpenAvailabilities ? (
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography color="text.secondary">
                        Loading open availability requests...
                      </Typography>
                    </Paper>
                  ) : openAvailabilities.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography color="text.secondary">
                        No open availability requests right now.
                      </Typography>
                    </Paper>
                  ) : (
                    openAvailabilities.map((item) => (
                      <Paper
                        key={item.rosterWeekId}
                        variant="outlined"
                        sx={{ p: 2.5, borderRadius: 3 }}
                      >
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Typography fontWeight={700}>{item.storeName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Week of {formatWeekLabel(item.weekStartDate, item.weekEndDate)}
                              </Typography>
                            </Box>

                            <Chip
                              label={item.hasSubmission ? "Draft" : "Not Submitted"}
                              color={getAvailabilityChipColor(item.hasSubmission)}
                              size="small"
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            Deadline: {new Date(item.availabilityCloseAtUtc).toLocaleString()}
                          </Typography>

                          <Button
                            variant="contained"
                            onClick={() =>
                              handleOpenAvailability(item.storeId, item.rosterWeekId)
                            }
                          >
                            {item.hasSubmission ? "Edit Availability" : "Submit Availability"}
                          </Button>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, boxShadow: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Published Shifts
                </Typography>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography color="text.secondary">
                    Not connected yet.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Availability History
                  </Typography>
                </Stack>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography color="text.secondary">
                    Not connected yet.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Shift History
                  </Typography>
                </Stack>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography color="text.secondary">
                    Not connected yet.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}