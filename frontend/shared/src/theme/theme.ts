import { createTheme } from "@mui/material/styles";

const FONT_SANS = '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace';

export const theme = createTheme({
    typography: {
        fontFamily: FONT_SANS,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                code: { fontFamily: FONT_MONO },
                pre: { fontFamily: FONT_MONO },
            },
        },
    },
});
