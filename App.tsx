import { PaperProvider } from "react-native-paper"
import RootLayout from "./app/layout/RootLayout"
import { theme } from "./app/theme/theme"

export default () => {
  return (
    <PaperProvider theme={theme}>
      <RootLayout />
    </PaperProvider>
  )
}
