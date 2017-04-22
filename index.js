'use strict';

/**
 * Configuration
 */
let config = {};

/**
 * External libs
 */
const cors = require('cors');
const mysql = require('mysql');
const convict = require('convict');
const express = require('express');
const load = require('express-load');
const httpError = require('http-errors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

/**
 * Initialize Pino Logger
 */
const logger = require('pino')({
    level: process.env.LOG_LEVEL || 'info',
    name: 'myApp'
});

/**
 * Initialize default.json donfiguration
 */
try {
    logger.debug('Load default.json configuration');
    config = convict(require('./config/default.json'));
    logger.level = config.get('log.level');
} catch (err) {
    logger.error(err, 'Error while loading default configuration');
    process.exit(1);
}

/**
 * Load { NODE_ENV }.json configuration
 * Perform validation
 */
try {
    logger.debug('Load %s.json configuration', config.get('env'));
    config.load(require('./config/' + config.get('env') + '.json'));
    logger.level = config.get('log.level');
    config.validate({
        allowed: 'strict'
    });
} catch (err) {
    logger.error(err, 'Error while loading %s.json configuration', config.get('env'));
    process.exit(1);
}

/**
 * Set global variables
 */
app.disable('x-powered-by');
app.set('config', config);
app.set('logger', logger);

/**
 * Express middleware
 */
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.get('/user/:id', function (req, res) {
    logger.info(req.params, 'req.params from request');
    // Fake row from database
    res.json({
        "id": req.params.id,
        "username": "Jan",
        "city": "Warszawa",
        "age": 12
    });
});
/**no
 * Handle global 404
 */
app.use((req, res, next) => {
    next(httpError(404, 'Resource or action not found'));
});

/**
 * Sending errors to client
 */
app.use((err, req, res, next) => {
    /* jshint unused:false */
    let error = {
        name: err.name,
        status: err.status || 500
    };
    logger.error(err, err.name);
    res.status(err.status || 500);
    res.json(error);
});

/**
 * Start listening application
 */
app.listen(config.get('port'), () => {
    logger.info('Application listening on port', config.get('port'));
    app.emit('listen');
});