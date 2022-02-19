const express = require('express');
const router = express.Router();
const auth = require('../helpers/authentification');

const factionController = require('../controllers/leader/faction');
const userController = require('../controllers/leader/user');
const roleController = require('../controllers/leader/role');
const operationTypeController = require('../controllers/leader/operationType');

router.get('/users', auth.isAuthenticated, auth.hasRank(4), userController.index);
router.get('/users/:id', auth.isAuthenticated, auth.hasRank(4), userController.show);
router.post('/users/:id', auth.isAuthenticated, auth.hasRank(4), userController.update);
router.get('/users/:id/resetPassword', auth.isAuthenticated, auth.hasRank(4), userController.resetPassword);
router.get('/users/:id/delete', auth.isAuthenticated, auth.hasRank(4), userController.delete);

router.get('/roles', auth.isAuthenticated, auth.hasRank(4), roleController.index);
router.get('/roles/create', auth.isAuthenticated, auth.hasRank(4), roleController.create);
router.post('/roles/create', auth.isAuthenticated, auth.hasRank(4), roleController.store);
router.get('/roles/:id', auth.isAuthenticated, auth.hasRank(4), roleController.show);
router.post('/roles/:id', auth.isAuthenticated, auth.hasRank(4), roleController.update);
router.get('/roles/:id/delete', auth.isAuthenticated, auth.hasRank(4), roleController.delete);

router.get('/faction', auth.isAuthenticated, auth.hasRank(4), factionController.index);
router.get('/faction/create', auth.isAuthenticated, auth.hasRank(4), factionController.create);
router.post('/faction/create', auth.isAuthenticated, auth.hasRank(4), factionController.store);
router.get('/faction/:id', auth.isAuthenticated, auth.hasRank(4), factionController.show);
router.post('/faction/:id', auth.isAuthenticated, auth.hasRank(4), factionController.update);
router.get('/faction/:id/delete', auth.isAuthenticated, auth.hasRank(4), factionController.delete);

router.get('/operationTypes', auth.isAuthenticated, auth.hasRank(4), operationTypeController.index);
router.get('/operationTypes/create', auth.isAuthenticated, auth.hasRank(4), operationTypeController.create);
router.post('/operationTypes/create', auth.isAuthenticated, auth.hasRank(4), operationTypeController.store);
router.get('/operationTypes/:id', auth.isAuthenticated, auth.hasRank(4), operationTypeController.show);
router.post('/operationTypes/:id', auth.isAuthenticated, auth.hasRank(4), operationTypeController.update);
router.get('/operationTypes/:id/delete', auth.isAuthenticated, auth.hasRank(4), operationTypeController.delete);

module.exports = router;
