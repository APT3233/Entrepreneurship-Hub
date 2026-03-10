import { EventEmitter } from "node:events";
import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Event Bus
 * Handles internal domain events with automatic error catching and logging.
 * This is an in-memory bus for decoupling modules within the same process.
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit for large scale applications
    this.setMaxListeners(50);
  }

  /**
   * Emit an event.
   * Overrides default emit to provide error isolation and automatic logging.
   * @param {string} event - Event name (should be from constants/events.js)
   * @param {any} payload - Optional data attached to the event
   * @returns {boolean} True if the event had listeners
   */
  emit(event, payload) {
    const listeners = this.listeners(event);

    if (listeners.length === 0) {
      logger.debug(`[EventBus] No listeners registered for: ${event}`);
      return false;
    }

    logger.debug(`[EventBus] Publishing: ${event}`, { payload });

    listeners.forEach((handler) => {
      try {
        // Execution isolation: one failing listener shouldn't stop others
        const result = handler(payload);

        // Support for async listeners
        if (result instanceof Promise) {
          result.catch((err) => {
            logger.error(`[EventBus] Async listener failure for: ${event}`, {
              err,
              payload,
              handler: handler.name || "anonymous",
            });
          });
        }
      } catch (err) {
        logger.error(`[EventBus] Sync listener failure for: ${event}`, {
          err,
          payload,
          handler: handler.name || "anonymous",
        });
      }
    });

    return true;
  }

  /**
   * Type-safe subscribe helper (optional but good for IDEs)
   */
  on(event, handler) {
    return super.on(event, handler);
  }
}

// Export as singleton for easy access across the application
export const eventBus = new EventBus();
