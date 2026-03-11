import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { login, saveAuth, getStoredUser } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const existingUser = getStoredUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (existingUser) {
    return (
      <Navigate
        to={existingUser.role === "Manager" ? "/manager" : "/employee"}
        replace
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const result = await login({ email, password });
      saveAuth(result);

      navigate(result.role === "Manager" ? "/manager" : "/employee", {
        replace: true,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Login failed. Please check your email and password.";
      setErrorMessage(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f6f8fb",
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, boxShadow: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Roster App
                </Typography>
                <Typography color="text.secondary" mt={1}>
                  Sign in to continue
                </Typography>
              </Box>

              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {errorMessage && (
                <Paper sx={{ p: 2, bgcolor: "#fff4f4" }} elevation={0}>
                  <Typography color="error">{errorMessage}</Typography>
                </Paper>
              )}

              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}