const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('hbs');
const session = require('express-session');
const {flash} = require('express-flash-message')
const Utility = require('./helpers/utility');
const auth = require('./helpers/authentification');
const hbsLocals = require('./helpers/hbs-locals')();

require('dotenv').config();

const indexRouter = require('./routes/index');
const leaderRouter = require('./routes/leader');

const app = express();

// view engine setup
hbs.registerPartials(__dirname + '/views/partials');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(
    session({
        secret: Utility.generateRandomString(42),
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
            // secure: true, // becareful set this option, check here: https://www.npmjs.com/package/express-session#cookiesecure. In local, if you set this to true, you won't receive flash as you are using `http` in local, but http is not secure
        },
    })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(Utility.generateRandomString(32)));
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

app.use(hbsLocals);

require('./start/hbs-helpers')(hbs);

app.use('/', indexRouter);
app.use('/leader', leaderRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
