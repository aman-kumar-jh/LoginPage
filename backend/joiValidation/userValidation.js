const Joi = require('@hapi/joi');

/**
 * @schema Validation for the registration of the user
 * Assuming email feild always present
 * @with linking password and name with email compulsion 
 */

const UserSchema = Joi.object({
    name: Joi.string()
        .alphanum()
        .min(3)
        .max(100)
        .required(),

    password: Joi.string()
        .pattern(new RegExp('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}')),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net','in'] } })
}).with('email',['password','name']);

module.exports = UserSchema; 