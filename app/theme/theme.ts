import { MD3LightTheme as DefaultTheme } from "react-native-paper"

export const theme = {
  ...DefaultTheme,
  myOwnProperty: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "rgba(0,0,0,255)",
    secondary: "rgb(247,233,10)",
    error: "#FF6961",
    success: "#88a644",
  },
}
