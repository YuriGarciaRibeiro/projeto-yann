import * as React from "react"

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(mobileMediaQuery)

  mediaQueryList.addEventListener("change", callback)

  return () => mediaQueryList.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.matchMedia(mobileMediaQuery).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
