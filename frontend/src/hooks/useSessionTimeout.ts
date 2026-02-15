import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth'

interface SessionTimeoutConfig {
  timeoutMinutes?: number
  warningMinutes?: number
  checkIntervalSeconds?: number
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 25,
  checkIntervalSeconds = 60,
}: SessionTimeoutConfig = {}) => {
  const { logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const lastActivityRef = useRef(Date.now())
  const warningShownRef = useRef(false)

  const updateLastActivity = () => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    warningShownRef.current = false
  }

  const getTimeLeft = () => {
    const now = Date.now()
    const elapsed = now - lastActivityRef.current
    const remaining = (timeoutMinutes * 60 * 1000) - elapsed
    return Math.max(0, remaining)
  }

  const handleLogout = () => {
    logout()
    setShowWarning(false)
  }

  const extendSession = () => {
    updateLastActivity()
    setTimeLeft(null)
  }

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity, true)
      })
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeLeft()
      const remainingMinutes = Math.ceil(remaining / (1000 * 60))

      if (remaining <= 0) {
        handleLogout()
        return
      }

      if (remainingMinutes <= (timeoutMinutes - warningMinutes) && !warningShownRef.current) {
        setShowWarning(true)
        setTimeLeft(remainingMinutes)
        warningShownRef.current = true
      } else if (showWarning) {
        setTimeLeft(remainingMinutes)
      }
    }, checkIntervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [timeoutMinutes, warningMinutes, checkIntervalSeconds, showWarning, handleLogout])

  return {
    showWarning,
    timeLeft,
    extendSession,
    updateLastActivity,
  }
}