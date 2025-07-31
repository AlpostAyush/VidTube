import {createLogger, format, transports} from "winston"; 
const {combine, timestamp, json, colorize} = format;

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
  format.colorize(),
  format.printf(({ level, message, timestamp }) => {
    return `${level}: ${message}`;
  })
);

// Create a winston  logger
const logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp(), json()),  // as a wrapper
  transports: [               //how to transport the logs 
    new transports.Console({                // overwrite console
      format: consoleLogFormat,
    }),
    new transports.File({ filename: "app.log" }),  // for ease in getting parsed in log processing systems 
  ],
});

export default logger;