import { useNavigate, useLocation } from 'react-router-dom'

// Expo Router の代替実装
export const useRouter = () => {
  const navigate = useNavigate()
  
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    canGoBack: () => window.history.length > 1
  }
}

export const useLocalSearchParams = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}