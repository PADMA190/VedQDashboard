'use strict';

const winston = require('winston');
const env = require('./env');

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  splat(),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} ${level} ${message}${metaStr}${stackStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const logger = winston.createLogger({
  level: env.log.level,
  format: env.isProd ? prodFormat : devFormat,
  transports: [new winston.transports.Console({ handleExceptions: true })],
  exitOnError: false,
});

module.exports = logger;
