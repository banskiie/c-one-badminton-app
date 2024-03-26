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

const Stack = createNativeStackNavigator()

export default () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

  useEffect(() => {
    ScreenOrientation.unlockAsync()
  }, [])

  return (
    <>
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
    </>
  )
}
