import { EventBus } from 'ah-event-bus';

export class BaseViewModel<EV extends Record<string, any>> {
  readonly event = new EventBus<EV>();

  dispose() {
    this.event.clear();
  }
}
