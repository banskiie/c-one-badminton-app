import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

type AuthStore = {
  isLoggedIn: boolean
  //   isAdmin: boolean
  updateAuth: (isLoggedIn: boolean) => void
  //   updateAdmin: (isAdmin: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      //   isAdmin: false,
      updateAuth: (status) => set(() => ({ isLoggedIn: status })),
      //   updateAdmin: (status) => set(() => ({ isAdmin: status })),
    }),
    {
      name: "local-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
