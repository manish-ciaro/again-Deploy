import "./App.css";
import { Box } from "@mui/material";
import Header from "./component/Header";
import PublicRoutes from "./routes/public route/PublicRoutes";
import UserContextProvider from "./context/UserContextProvider";

function App() {
  return (
    <UserContextProvider>
      <Box className="h-screen">
        <Header />
        <PublicRoutes />
      </Box>
    </UserContextProvider>
  );
} 

export default App;
