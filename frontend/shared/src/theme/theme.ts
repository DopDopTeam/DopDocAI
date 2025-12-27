import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "dark"
    },
    shape: {
        borderRadius: 10
    },
    components: {
        MuiDrawer: {
            styleOverrides: {
                paper: { borderRight: "1px solid rgba(255,255,255,0.08)" }
            }
        }
    }
});
