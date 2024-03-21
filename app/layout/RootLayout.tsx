import { useEffect } from "react"
// React Navigation
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
// Components
import Login from "../auth/Login"
import HomeLayout from "./HomeLayout"
// Zustand
import { useAuthStore } from "../store/store"
// Screen Orientation
import * as ScreenOrientation from "expo-screen-orientation"
import { useFonts } from "expo-font"
import Loading from "../components/Loading"

const Stack = createNativeStackNavigator()

export default () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../assets/fonts/Inter.ttf"),
  })

  useEffect(() => {
    ScreenOrientation.unlockAsync()
  }, [])

  return (
    <>
      {fontsLoaded ? (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="App">
            {isLoggedIn ? (
              <Stack.Screen
                name="App"
                component={HomeLayout}
                options={{ headerShown: false }}
              />
            ) : (
              <Stack.Screen
                name="App"
                component={Login}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <Loading />
      )}
    </>
  )
}
