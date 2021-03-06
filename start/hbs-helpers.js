const isUrl = require('is-url');
const db = require('../models').sequelize;
const moment = require('moment');
const {val} = require("cheerio/lib/api/attributes");
moment.locale('de');

module.exports = async function (hbs) {
    hbs.registerHelper('style', function (fileName) {
        if(isUrl(fileName))
            return `<link rel="stylesheet" href="${fileName}" />`;
        return `<link rel="stylesheet" href="/stylesheets/${fileName}.css" />`;
    });

    hbs.registerHelper('script', function (fileName, defer = false) {
        if(isUrl(fileName))
            return `<script src="${fileName}" ${defer ? 'defer' : ''} /></script>`;
        return `<script src="/javascripts/${fileName}.js" ${defer ? 'defer' : ''}></script>`;
    });


    hbs.registerHelper('times', function (n, block) {
        let accum = '';
        for (let i = 0; i < n; ++i)
            accum += block.fn(i);
        return accum;
    });

    hbs.registerHelper('ternary', function (condition, yes, no) {
        return condition ? yes : no;
    });
    hbs.registerHelper('ternary-eq', function (var1, var2, yes, no) {
        return var1 === var2 ? yes : no;
    });

    hbs.registerHelper('eq', function (var1, var2) {
        return var1 == var2;
    });

    hbs.registerHelper('startsWith', function (var1, var2) {
        return var1.startsWith(var2);
    });

    hbs.registerHelper('not', function (var1, var2) {
        return var1 !== var2;
    });

    hbs.registerHelper('seq', function (var1, var2) {
        return var1 === var2;
    });

    hbs.registerHelper('gt', function (var1, var2) {
        return var1 > var2;
    });
    hbs.registerHelper('gte', function (var1, var2) {
        return var1 >= var2;
    });

    //math
    hbs.registerHelper('sub', function (var1, var2) {
        return parseInt(var1) - parseInt(var2);
    });

    hbs.registerHelper('multi', function (var1, var2) {
        return parseInt(var1) * parseInt(var2);
    });

    hbs.registerHelper('add', function (var1, var2) {
        return parseInt(var1) + parseInt(var2);
    });

    hbs.registerHelper('addString', function (var1, var2) {
        return var1 + var2;
    });

    hbs.registerHelper('sliceString', function (string, length) {
        return string.slice(0, length);
    });

    hbs.registerHelper('ifSEquals', function (arg1, arg2, options) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    hbs.registerHelper('ifSNTEquals', function (arg1, arg2, options) {
        return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
    });

    hbs.registerHelper('ifGte', function (arg1, arg2, options) {
        return (arg1 >= arg2) ? options.fn(this) : options.inverse(this);
    });

    hbs.registerHelper('or', function (arg1, arg2) {
        return (arg1 || arg2);
    });

    hbs.registerHelper("money", function (number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,

        }).format(number).replace(/,/g, '.')
    });

    hbs.registerHelper("numberFormatThousands", function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    hbs.registerHelper("log", function (something) {
        console.log(something, typeof (something));
    });

    hbs.registerHelper("jsonLog", function (something) {
        console.log(JSON.stringify(something));
    });

    hbs.registerHelper("pagination", function (page, total) {
        let current = parseInt(page),
            last = total,
            delta = 2,
            left = current - delta,
            right = current + delta + 1,
            range = [],
            rangeWithDots = [],
            l;

        for (let i = 1; i <= last; i++) {
            if (i === 1 || i === last || i >= left && i < right) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push(undefined);
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    });

    hbs.registerHelper("isRouteActive", function (routeBase, routeNow) {
        return (routeNow.substr(0, routeBase.length) === routeBase);
    });

    hbs.registerHelper("urlify", function (text) {
        const urlRegex = /(?<!=")(\b[\w]+:\/\/[\w-?&;#~=:\.\/\@]+[\w\/])/gis;
        return text.replace(urlRegex, function(url) {
            return '<a href="' + url + '">' + url + '</a>';
        });
    });

    hbs.registerHelper("momentFromNow", function (timestamp) {
        return moment(Number(timestamp)).fromNow();
    });

    hbs.registerHelper("formatTime", function (timestamp) {
        return moment.unix(new Date(timestamp).getTime() / 1000).add(-1,'hours').format('DD.MM.YYYY, HH:mm');
    });

    hbs.registerHelper("money", function (number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,

        }).format(number).replace(/,/g, '.')
    });

    hbs.registerHelper("urlify", function (text) {
        const urlRegex = /(?<!=")(\b[\w]+:\/\/[\w-?&;#~=:\.\/\@]+[\w\/])/gis;
        return text.replace(urlRegex, function(url) {
            return '<a href="' + url + '">' + url + '</a>';
        });
    });

    hbs.registerHelper("getOperationMoney", function (operation) {
        operation = operation.toJSON();
        switch (operation.OperationType.countType) {
            case 0: // operation.amount = money
                return operation.value;
            case 1: // OperationType.value = money
                return operationMoney += operation.OperationType.value;
            case 2: // OperationType.value * operation.amount = money
                return operationMoney += operation.OperationType.value * value;
        }
    });
};
