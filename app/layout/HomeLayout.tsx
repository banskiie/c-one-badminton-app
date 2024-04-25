import React, { useEffect } from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Icon } from "react-native-paper"
// Theme
import { theme } from "../theme/theme"
// Game
import Games from "../tabs/games/Games"
import ScoreGame from "../tabs/games/ScoreGame"
import AddGame from "../tabs/games/AddGame"
import History from "../tabs/games/History"
import ViewGame from "../tabs/games/ViewGame"
// Profile
import Profile from "../tabs/profile/Profile"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const HistoryStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="History" component={History} />
      <Stack.Screen name="View Game" component={ViewGame} />
    </Stack.Navigator>
  )
}

const GameStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Games" component={Games} />
      <Stack.Screen name="Score Game" component={ScoreGame} />
      <Stack.Screen name="Add Game" component={AddGame} />
    </Stack.Navigator>
  )
}

export default () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        tabBarStyle: { height: 50 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
      }}
      initialRouteName="Games"
    >
      <Tab.Screen
        name="Game Stack"
        component={GameStack}
        options={{
          // tabBarStyle: {
          //   display: "none",
          // },
          title: "Games",
          tabBarIcon: ({ color, size }) => {
            return <Icon source="badminton" size={size} color={color} />
          },
        }}
      />
      <Tab.Screen
        name="History Stack"
        component={HistoryStack}
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => {
            return <Icon source="history" size={25} color={color} />
          },
        }}
      />
      <Tab.Screen
        name="Profile Stack"
        component={Profile}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => {
            return <Icon source="account-circle" size={size} color={color} />
          },
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  )
}
