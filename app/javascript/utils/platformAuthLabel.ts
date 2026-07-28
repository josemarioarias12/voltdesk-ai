interface NavigatorUAData {
  platform: string
}

function getClientHintsPlatform(): string | null {
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData
  return uaData?.platform ?? null
}

// iPadOS reports itself as "Macintosh"; maxTouchPoints tells a real Mac from an iPad.
function isIPadPretendingToBeMac(): boolean {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function getPlatformAuthenticatorName(): string {
  if (typeof navigator === 'undefined') return 'your device'

  const userAgent = navigator.userAgent
  const clientHintsPlatform = getClientHintsPlatform()

  const isIOS = /iPhone|iPad|iPod/.test(userAgent) || isIPadPretendingToBeMac()
  if (isIOS) return 'Face ID'

  const isMac = clientHintsPlatform === 'macOS' || /Macintosh/.test(userAgent)
  if (isMac) return 'Touch ID'

  const isWindows = clientHintsPlatform === 'Windows' || /Windows NT/.test(userAgent)
  if (isWindows) return 'Windows Hello'

  return 'your device'
}