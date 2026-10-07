import { useContext } from 'react'
import { AuthContext, type AuthValue } from './authContext'

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value)
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  return value
}
