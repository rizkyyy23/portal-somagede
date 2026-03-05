/**
 * Logger utility — Portal Somagede
 *
 * Di development: semua log tampil normal di console.
 * Di production: log dimatikan supaya tidak mengotori console user.
 *
 * Cara pakai:
 *   import { logger } from "../utils/logger";
 *   logger.error("Something went wrong:", err);
 *   logger.warn("Heads up:", data);
 *   logger.info("FYI:", detail);
 */

const isDev = import.meta.env.DEV;

const noop = () => {};

export const logger = {
  error: isDev ? console.error.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  log: isDev ? console.log.bind(console) : noop,
};
