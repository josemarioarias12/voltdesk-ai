import { useEffect, useRef } from 'react'
import * as ActionCable from '@rails/actioncable'

interface UseActionCableOptions {
  channel: string
  [key: string]: unknown
}

let consumer: ActionCable.Consumer | null = null

function getConsumer(): ActionCable.Consumer {
  if (!consumer) {
    consumer = ActionCable.createConsumer('/cable')
  }
  return consumer
}

export function useActionCable(
  channelConfig: UseActionCableOptions,
  onReceived: (data: Record<string, unknown>) => void
): void {
  const onReceivedRef = useRef(onReceived)
  onReceivedRef.current = onReceived
  const configKey = JSON.stringify(channelConfig)

  useEffect(() => {
    let active = true
    const subscription = getConsumer().subscriptions.create(channelConfig, {
      received(data: unknown) {
        if (active) {
          onReceivedRef.current(data as Record<string, unknown>)
        }
      },
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])
}
