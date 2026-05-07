'use strict';

const { param } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const userIdParam = [
  param('userId').custom((v) => {
    if (!isValidObjectId(v)) throw new Error('Invalid userId');
    return true;
  }),
];

module.exports = { userIdParam };
