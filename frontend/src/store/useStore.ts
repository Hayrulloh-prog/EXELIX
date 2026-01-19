import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type Language = 'ru' | 'en' | 'kg'

interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  telegram?: string
  photo?: string
  profileType: 'open' | 'closed'
  activeNow: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface AppState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
  toggleTheme: () => void
}

interface Store extends AppState, AuthState {
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

const useStore = create<Store>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,

      // App
      theme: 'light',
      language: 'ru',

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      setLanguage: (lang) => {
        set({ language: lang })
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          document.documentElement.classList.toggle('dark', newTheme === 'dark')
          return { theme: newTheme }
        })
      }
    }),
    {
      name: 'exelix-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        token: state.token,
        user: state.user
      })
    }
  )
)

export default useStore
