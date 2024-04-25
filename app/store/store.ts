import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

type AuthStore = {
  isLoggedIn: boolean
  updateAuth: (isLoggedIn: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      updateAuth: (status) => set(() => ({ isLoggedIn: status })),
    }),
    {
      name: "local-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
