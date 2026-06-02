import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    App: {
      cable: {
        subscriptions: {
          create: (
            channelConfig: Record<string, unknown>,
            callbacks: {
              received?: (data: unknown) => void
              connected?: () => void
              disconnected?: () => void
            }
          ) => { unsubscribe: () => void }
        }
      }
    }
  }
}

interface UseActionCableOptions {
  channel: string
  [key: string]: unknown
}

export function useActionCable(
  channelConfig: UseActionCableOptions,
  onReceived: (data: Record<string, unknown>) => void
): void {
  const onReceivedRef = useRef(onReceived)
  onReceivedRef.current = onReceived

  useEffect(() => {
    if (!window.App?.cable) {
      console.warn('[useActionCable] ActionCable not initialized.')
      return
    }

    const subscription = window.App.cable.subscriptions.create(channelConfig, {
      received(data: unknown) {
        onReceivedRef.current(data as Record<string, unknown>)
      },
    })

    return () => { subscription.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(channelConfig)])
}
