const AppError = require('../utils/AppError');

/**
 * Express middleware factory that validates req.body against a Joi schema.
 * Usage: validate(someJoiSchema)
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }

  req.body = value; // use the sanitized value
  next();
};

module.exports = validate;
