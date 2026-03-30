import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMyAvailabilitySubmission,
  upsertMyAvailabilitySubmission,
  type AvailabilitySubmissionResponse,
  type AvailableShiftType,
  type PreferredShiftType,
} from "../services/availabilitySubmissions";
import {
  getRosterWeekDetail,
  type RosterWeekDetail,
} from "../services/rosterWeekDetail";

type AvailabilitySlotFormRow = {
  date: string;
  dayLabel: string;
  availableShiftType: AvailableShiftType;
  preferredShiftType: PreferredShiftType;
  note: string;
};

function mapCodeToAvailability(code: string): AvailableShiftType | null {
  if (code === "AA") return "FullDay";
  if (code === "BB") return "HalfDay";
  if (code === "CC") return "Morning";
  if (code === "DD") return "Evening";
  return null;
}

function parseAvailabilityCode(input: string) {
  const cleaned = input.toUpperCase().replace(/\s+/g, "");
  const regex = /([1-7]+)(AA|BB|CC|DD)/g;

  const instructions: { days: number[]; availableShiftType: AvailableShiftType }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    const dayPart = match[1];
    const codePart = match[2];
    const availableShiftType = mapCodeToAvailability(codePart);

    if (!availableShiftType) continue;

    const days = [...new Set(dayPart.split("").map(Number).filter((n) => n >= 1 && n <= 7))];
    instructions.push({ days, availableShiftType });
  }

  return instructions;
}

function getAllowedPreferredOptions(
  availableShiftType: AvailableShiftType
): PreferredShiftType[] {
  switch (availableShiftType) {
    case "None":
      return ["None"];
    case "Morning":
      return ["None"];
    case "Evening":
      return ["None"];
    case "HalfDay":
      return ["None", "Morning", "Evening"];
    case "FullDay":
      return ["None", "Morning", "Evening", "FullDay"];
    default:
      return ["None"];
  }
}

function normalizePreferredShiftType(
  availableShiftType: AvailableShiftType,
  preferredShiftType: PreferredShiftType
): PreferredShiftType {
  const allowed = getAllowedPreferredOptions(availableShiftType);
  return allowed.includes(preferredShiftType) ? preferredShiftType : "None";
}

function buildWeekRows(weekStartDate: string): AvailabilitySlotFormRow[] {
  const start = new Date(`${weekStartDate}T00:00:00`);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");

    return {
      date: `${yyyy}-${mm}-${dd}`,
      dayLabel: dayLabels[current.getDay()],
      availableShiftType: "None",
      preferredShiftType: "None",
      note: "",
    };
  });
}

function formatWeekLabel(start: string, end: string) {
  return `${start} - ${end}`;
}

export default function EmployeeAvailabilityPage() {
  const navigate = useNavigate();
  const { storeId, rosterWeekId } = useParams<{
    storeId: string;
    rosterWeekId: string;
  }>();

  const [rosterWeek, setRosterWeek] = useState<RosterWeekDetail | null>(null);
  const [rows, setRows] = useState<AvailabilitySlotFormRow[]>([]);
  const [note, setNote] = useState("");
  const [availabilityCode, setAvailabilityCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId || !rosterWeekId) {
        setError("Missing storeId or rosterWeekId.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMessage("");

        const detail = await getRosterWeekDetail(storeId, rosterWeekId);
        setRosterWeek(detail);

        const baseRows = buildWeekRows(detail.weekStartDate);

        try {
          const submission: AvailabilitySubmissionResponse =
            await getMyAvailabilitySubmission(rosterWeekId);

          const mappedRows = baseRows.map((row) => {
            const existing = submission.slots.find((slot) => slot.date === row.date);
            if (!existing) return row;

            return {
              ...row,
              availableShiftType: existing.availableShiftType,
              preferredShiftType: existing.preferredShiftType,
              note: existing.note ?? "",
            };
          });

          setRows(mappedRows);
          setNote(submission.note ?? "");
        } catch (submissionError: any) {
          if (submissionError?.response?.status === 404) {
            setRows(baseRows);
            setNote("");
          } else {
            throw submissionError;
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            "Failed to load availability page."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, rosterWeekId]);

  const selectedCount = useMemo(() => {
    return rows.filter((row) => row.availableShiftType !== "None").length;
  }, [rows]);

  const handleApplyCode = () => {
    const instructions = parseAvailabilityCode(availabilityCode);

    if (instructions.length === 0) {
      setMessage("Code not recognized. Example: 123AA45BB67CC");
      return;
    }

    setRows((prev) => {
      const next = prev.map((row) => ({
        ...row,
        availableShiftType: "None" as AvailableShiftType,
        preferredShiftType: "None" as PreferredShiftType,
      }));

      for (const instruction of instructions) {
        for (const day of instruction.days) {
          const target = next[day - 1];
          if (!target) continue;

          target.availableShiftType = instruction.availableShiftType;
          target.preferredShiftType = normalizePreferredShiftType(
            instruction.availableShiftType,
            target.preferredShiftType
          );
        }
      }

      return next;
    });

    setMessage("Availability code applied.");
  };

  const handleAvailableChange = (
    index: number,
    availableShiftType: AvailableShiftType
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        return {
          ...row,
          availableShiftType,
          preferredShiftType: normalizePreferredShiftType(
            availableShiftType,
            row.preferredShiftType
          ),
        };
      })
    );
  };

  const handlePreferredChange = (
    index: number,
    preferredShiftType: PreferredShiftType
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, preferredShiftType } : row))
    );
  };

  const handleRowNoteChange = (index: number, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, note: value } : row))
    );
  };

  const buildPayload = () => {
    return {
      note: note || null,
      slots: rows.map((row) => ({
        date: row.date,
        availableShiftType: row.availableShiftType,
        preferredShiftType: row.preferredShiftType,
        note: row.note || null,
      })),
    };
  };

  const handleSubmit = async () => {
    if (!rosterWeekId) return;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = buildPayload();
      await upsertMyAvailabilitySubmission(rosterWeekId, payload);

      setMessage("Availability submitted successfully.");
      navigate("/employee", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to submit availability."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading availability...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Button variant="text" onClick={() => navigate("/employee")} sx={{ mb: 1 }}>
            Back to Dashboard
          </Button>

          <Typography variant="h4" fontWeight={800}>
            Edit Availability
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {rosterWeek?.storeName} · Week of{" "}
            {rosterWeek
              ? formatWeekLabel(rosterWeek.weekStartDate, rosterWeek.weekEndDate)
              : ""}
          </Typography>
          <Typography color="text.secondary">
            Deadline:{" "}
            {rosterWeek?.availabilityCloseAtUtc
              ? new Date(rosterWeek.availabilityCloseAtUtc).toLocaleString()
              : ""}
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Quick Fill by Code
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Suggested mapping: AA = FullDay, BB = HalfDay, CC = Morning, DD = Evening
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Availability Code"
                  value={availabilityCode}
                  onChange={(e) => setAvailabilityCode(e.target.value)}
                  placeholder="Example: 123AA45BB67CC"
                />
                <Button variant="contained" onClick={handleApplyCode}>
                  Apply Code
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  Weekly Availability
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected days: {selectedCount}
                </Typography>
              </Stack>

              <Grid container spacing={2} sx={{ fontWeight: 700, px: 1 }}>
                <Grid size={{ xs: 12, md: 1.2 }}>
                  <Typography variant="body2">Day</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 1.6 }}>
                  <Typography variant="body2">Date</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 2.8 }}>
                  <Typography variant="body2">Availability</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 2.8 }}>
                  <Typography variant="body2">Prefer</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3.6 }}>
                  <Typography variant="body2">Note</Typography>
                </Grid>
              </Grid>

              {rows.map((row, index) => {
                const allowedPreferredOptions = getAllowedPreferredOptions(
                  row.availableShiftType
                );

                return (
                  <Grid
                    container
                    spacing={2}
                    key={row.date}
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Grid size={{ xs: 12, md: 1.2 }}>
                      <Typography fontWeight={600}>{row.dayLabel}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 1.6 }}>
                      <Typography color="text.secondary">{row.date}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2.8 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Availability</InputLabel>
                        <Select
                          label="Availability"
                          value={row.availableShiftType}
                          onChange={(e) =>
                            handleAvailableChange(
                              index,
                              e.target.value as AvailableShiftType
                            )
                          }
                        >
                          <MenuItem value="None">None</MenuItem>
                          <MenuItem value="Morning">Morning</MenuItem>
                          <MenuItem value="Evening">Evening</MenuItem>
                          <MenuItem value="HalfDay">HalfDay</MenuItem>
                          <MenuItem value="FullDay">FullDay</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2.8 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Prefer</InputLabel>
                        <Select
                          label="Prefer"
                          value={row.preferredShiftType}
                          onChange={(e) =>
                            handlePreferredChange(
                              index,
                              e.target.value as PreferredShiftType
                            )
                          }
                        >
                          {allowedPreferredOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3.6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Optional note"
                        value={row.note}
                        onChange={(e) => handleRowNoteChange(index, e.target.value)}
                      />
                    </Grid>
                  </Grid>
                );
              })}

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="General Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any overall notes for your manager"
              />
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Availability"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}