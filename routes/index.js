const express = require('express');
const router = express.Router();
const auth = require('../helpers/authentification');

const loginController = require("../controllers/login");
const dashboardController = require("../controllers/dashboard");
const operationController = require("../controllers/operations");

/* GET home page. */
router.get('/', auth.isAuthenticated, dashboardController.index);

/* Login System. */
router.get('/login', auth.isUnauthenticated, loginController.login);
router.post('/login', auth.isUnauthenticated, loginController.loginSubmit);
router.get('/register', auth.isUnauthenticated, loginController.register);
router.post('/register', auth.isUnauthenticated, loginController.submitRegister);
router.get('/logout', auth.isAuthenticated, loginController.logout);

/* Operations System */
router.get('/operations', auth.isAuthenticated, auth.hasRank(0), operationController.index);
router.post('/operations', auth.isAuthenticated, auth.hasRank(0), operationController.setMembership);

router.get('/payment', auth.isAuthenticated, auth.hasRank(0), operationController.payment);
router.post('/payment', auth.isAuthenticated, auth.hasRank(0), operationController.setTempMoney);
router.get('/operations/create', auth.isAuthenticated, auth.hasRank(0), operationController.create);
router.post('/operations/create', auth.isAuthenticated, auth.hasRank(0), operationController.store);
router.get('/operations/manage', auth.isAuthenticated, auth.hasRank(4), operationController.managementIndex);

router.get('/operations/manage/:id/validate', auth.isAuthenticated, auth.hasRank(4), operationController.managementValidate);
router.get('/operations/manage/:id/delete', auth.isAuthenticated, auth.hasRank(4), operationController.managementDelete);
router.post('/operations/manage/:id/addUser', auth.isAuthenticated, auth.hasRank(0), operationController.managementAddUser);
router.post('/operations/manage/:id/removeUser', auth.isAuthenticated, auth.hasRank(0), operationController.managementRemoveUser);

router.get('/operations/stats', auth.isAuthenticated, auth.hasRank(0), operationController.statisticsIndex);

/* Profile System */
router.get('/profile', auth.isAuthenticated, dashboardController.profile);
router.post('/profile', auth.isAuthenticated, dashboardController.updatePassword);

module.exports = router;
