import * as ActionCable from '@rails/actioncable'

ActionCable.logger.enabled = true
export const cable = ActionCable.createConsumer('/cable')