const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const validateToken = require('../middlewares/validateTokenHandler');
const { protectAdmin } = require('../middlewares/adminMiddleware');

// public routes...
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);

// admin-protected routes...
router.use(validateToken);
router.use(protectAdmin);

// add images upload route (admin only)
router.post('/:id/images', roomController.upload.array('images', 8), roomController.uploadRoomImages);

// admin CRUD...
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.put('/:id/status', roomController.updateRoomStatus);

module.exports = router;