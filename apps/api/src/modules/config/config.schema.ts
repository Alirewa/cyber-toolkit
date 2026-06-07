import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:3000"),

  DATABASE_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRY: Joi.string().default("7d"),

  CSRF_SECRET: Joi.string().min(32).required(),

  SMTP_HOST: Joi.string().default("smtp.mailtrap.io"),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow("").default(""),
  SMTP_PASS: Joi.string().allow("").default(""),
  SMTP_FROM: Joi.string().default("noreply@cyberlab.io"),

  THROTTLE_GLOBAL_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),
  THROTTLE_TTL_MS: Joi.number().default(60000),

  SEED_ADMIN_EMAIL: Joi.string().email().default("admin@cyberlab.io"),
  SEED_ADMIN_USERNAME: Joi.string().default("superadmin"),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default("changeme_admin_password_strong"),

  // Sandbox / Docker labs
  SANDBOX_PROVIDER: Joi.string().valid("mock", "docker").default("mock"),
  SANDBOX_HOST: Joi.string().default("localhost"),
  SANDBOX_SCHEME: Joi.string().default("http"),
  SANDBOX_NETWORK: Joi.string().default("cyberlab_sandbox"),
  DOCKER_SOCKET_PATH: Joi.string().default("/var/run/docker.sock"),
  SANDBOX_TTL_MINUTES: Joi.number().default(60),
  SANDBOX_MEMORY_MB: Joi.number().default(256),
  SANDBOX_CPUS: Joi.number().default(0.5),
  SANDBOX_PORT_RANGE_START: Joi.number().default(21000),
  SANDBOX_PORT_RANGE_END: Joi.number().default(21999),
});
