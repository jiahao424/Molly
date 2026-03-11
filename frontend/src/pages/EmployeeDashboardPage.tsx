import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { clearAuth, getStoredUser } from "../services/authService";

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">This Week Shifts</Typography>
            <Typography variant="h3" fontWeight={700}>5</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6">Hours This Week</Typography>
            <Typography variant="h3" fontWeight={700}>28</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}