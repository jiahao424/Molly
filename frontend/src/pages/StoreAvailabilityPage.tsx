import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRosterWeekAvailabilitySubmissions,
  getRosterWeekDetail,
  type RosterWeekAvailabilitySubmissionResponse,
  type RosterWeekAvailabilityDayResponse,
  type RosterWeekDetail,
} from "../services/rosterWeekDetail";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function toDateKey(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildWeekDates(weekStartDate?: string) {
  if (!weekStartDate) return [];

  const result: string[] = [];
  const start = new Date(weekStartDate);

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }

  return result;
}

function formatHeaderDate(date: string) {
  const d = new Date(date);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}${weekdays[d.getDay()]}`;
}

function getShiftCode(
  shift: RosterWeekAvailabilityDayResponse["availableShiftType"]
) {
  switch (shift) {
    case "FullDay":
      return "AA";
    case "HalfDay":
      return "BB";
    case "Morning":
      return "CC";
    case "Evening":
      return "DD";
    case "None":
    default:
      return "--";
  }
}

function getPreferredCode(
  shift: RosterWeekAvailabilityDayResponse["preferredShiftType"]
) {
  switch (shift) {
    case "FullDay":
      return "AA";
    case "Morning":
      return "CC";
    case "Evening":
      return "DD";
    case "None":
    default:
      return "";
  }
}

function getAvailabilitySx(
  shift: RosterWeekAvailabilityDayResponse["availableShiftType"]
) {
  switch (shift) {
    case "FullDay":
      return {
        bgcolor: "#E8F5E9",
        color: "#2E7D32",
        borderColor: "#A5D6A7",
      };
    case "HalfDay":
      return {
        bgcolor: "#FFF3E0",
        color: "#EF6C00",
        borderColor: "#FFCC80",
      };
    case "Morning":
      return {
        bgcolor: "#E3F2FD",
        color: "#1565C0",
        borderColor: "#90CAF9",
      };
    case "Evening":
      return {
        bgcolor: "#F3E5F5",
        color: "#7B1FA2",
        borderColor: "#CE93D8",
      };
    case "None":
    default:
      return {
        bgcolor: "#F5F5F5",
        color: "#9E9E9E",
        borderColor: "#E0E0E0",
      };
  }
}

function getDayByDate(
  submission: RosterWeekAvailabilitySubmissionResponse,
  date: string
): RosterWeekAvailabilityDayResponse {
  const matched = submission.days.find((day) => toDateKey(day.date) === date);

  return (
    matched ?? {
      date,
      availableShiftType: "None",
      preferredShiftType: "None",
      note: null,
    }
  );
}

function AvailabilityCell({
  day,
}: {
  day: RosterWeekAvailabilityDayResponse;
}) {
  const availabilityCode = getShiftCode(day.availableShiftType);
  const preferredCode = getPreferredCode(day.preferredShiftType);
  const hasPreferred = preferredCode !== "";
  const hasNote = Boolean(day.note?.trim());
  const availabilitySx = getAvailabilitySx(day.availableShiftType);

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "stretch",
          border: "1px solid",
          borderColor: hasPreferred ? "#D0D7DE" : availabilitySx.borderColor,
          borderRadius: 2,
          overflow: "hidden",
          minWidth: hasPreferred ? 84 : 44,
          height: 36,
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            minWidth: 42,
            px: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            bgcolor: availabilitySx.bgcolor,
            color: availabilitySx.color,
          }}
        >
          {availabilityCode}
        </Box>

        {hasPreferred ? (
          <Box
            sx={{
              minWidth: 42,
              px: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              bgcolor: "#FDECEC",
              color: "#C62828",
              borderLeft: "1px solid #D0D7DE",
            }}
          >
            {preferredCode}
          </Box>
        ) : null}
      </Box>

      {hasNote ? (
        <Tooltip title={day.note!} arrow>
          <InfoOutlinedIcon
            sx={{
              fontSize: 16,
              color: "text.secondary",
              cursor: "help",
            }}
          />
        </Tooltip>
      ) : null}
    </Box>
  );
}

export default function StoreAvailabilityPage() {
  const navigate = useNavigate();
  const { storeId, rosterWeekId } = useParams<{
    storeId: string;
    rosterWeekId: string;
  }>();

  const [weekDetail, setWeekDetail] = useState<RosterWeekDetail | null>(null);
  const [submissions, setSubmissions] = useState<
    RosterWeekAvailabilitySubmissionResponse[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPageData = async () => {
      if (!storeId || !rosterWeekId) return;

      try {
        setLoading(true);
        setError("");

        const [detail, submissionData] = await Promise.all([
          getRosterWeekDetail(storeId, rosterWeekId),
          getRosterWeekAvailabilitySubmissions(storeId, rosterWeekId),
        ]);

        setWeekDetail(detail);
        setSubmissions(submissionData);
      } catch (error: any) {
        console.error("Failed to load roster week availability page:", error);
        setError(
          error?.response?.data?.message ||
            error?.response?.data ||
            "Failed to load availability page."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [storeId, rosterWeekId]);

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => a.userName.localeCompare(b.userName));
  }, [submissions]);

  const weekDates = useMemo(() => {
    return buildWeekDates(weekDetail?.weekStartDate);
  }, [weekDetail?.weekStartDate]);

  const noteCount = useMemo(() => {
    return sortedSubmissions.filter(
      (submission) =>
        submission.note?.trim() ||
        submission.days.some((day) => day.note?.trim())
    ).length;
  }, [sortedSubmissions]);

  const handleBack = () => {
    if (!storeId) {
      navigate("/manager");
      return;
    }

    navigate(`/manager/stores/${storeId}`);
  };

  const handleEditRoster = () => {
    if (!storeId || !rosterWeekId) return;
    navigate(`/manager/stores/${storeId}/roster-weeks/${rosterWeekId}/edit`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Button
              variant="text"
              onClick={handleBack}
              sx={{ alignSelf: "flex-start" }}
            >
              Back to Store Dashboard
            </Button>

            <Typography variant="h4" fontWeight={700}>
              View Availability
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {weekDetail
                ? `${weekDetail.storeName} · ${weekDetail.weekStartDate} - ${weekDetail.weekEndDate}`
                : "Roster week availability"}
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Chip
              label={loading ? "Loading..." : `${sortedSubmissions.length} submission(s)`}
              color="primary"
            />
            <Button variant="contained" onClick={handleEditRoster}>
              Edit Next Week Roster
            </Button>
          </Stack>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {weekDetail ? (
          <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1.25}>
                <Typography variant="h6" fontWeight={700}>
                  Week Summary
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: {weekDetail.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Availability closes at {formatDateTime(weekDetail.availabilityCloseAtUtc)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Notes present: {noteCount}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  AA = Full Day · BB = Half Day · CC = Morning · DD = Evening · right half = preferred · info icon = note
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading availability submissions...
          </Typography>
        ) : sortedSubmissions.length === 0 ? (
          <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" fontWeight={600}>
                No availability submissions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Once employees submit their availability, they will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ borderRadius: 4, overflow: "hidden", boxShadow: 2 }}>
            <TableContainer>
              <Table
                size="small"
                sx={{
                  tableLayout: "fixed",
                  "& .MuiTableCell-root": {
                    px: 1,
                    py: 1.25,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        bgcolor: "#FAFAFA",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <TableCell sx={{ width: 190 }}>Employee</TableCell>

                    {weekDates.map((date) => (
                      <TableCell
                        key={date}
                        align="center"
                        sx={{ width: 74 }}
                      >
                        {formatHeaderDate(date)}
                      </TableCell>
                    ))}

                    <TableCell sx={{ width: 170 }}>Overall Note</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sortedSubmissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      hover
                      sx={{
                        "& td": {
                          verticalAlign: "middle",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight={700} noWrap>
                          {submission.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {submission.userEmail}
                        </Typography>
                      </TableCell>

                      {weekDates.map((date) => {
                        const day = getDayByDate(submission, date);

                        return (
                          <TableCell key={date} align="center">
                            <AvailabilityCell day={day} />
                          </TableCell>
                        );
                      })}

                      <TableCell>
                        {submission.note ? (
                          <Tooltip title={submission.note} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                cursor: "help",
                              }}
                            >
                              {submission.note}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            --
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}