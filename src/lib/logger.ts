type LogLevel = 'info' | 'warn' | 'error';
class Logger {
  private logWithLevel(level: LogLevel, message: string, args?: string | object | '') {
    if (args instanceof Error) {
      // eslint-disable-next-line no-console
      console[level](`[${level.toUpperCase()}] ${message}`, {
        name: args.name,
        message: args.message,
        stack: args.stack,
      });
    } else {
      // eslint-disable-next-line no-console
      console[level](`[${level.toUpperCase()}] ${message} ${args ? args : ''}`);
    }
  }

  info(message: string, args?: string | object) {
    this.logWithLevel('info', message, args);
  }

  warn(message: string, args?: string | object) {
    this.logWithLevel('warn', message, args);
  }

  error(message: string, args?: string | object | Error) {
    this.logWithLevel('error', message, args);
  }
}

export const logger = new Logger();
