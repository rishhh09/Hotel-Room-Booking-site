const express = require("express");
const {registerUser , loginUser , userInfo} = require("../controllers/userController");
const validateToken = require("../middlewares/validateTokenHandler");
const router = express.Router();

router.post('/register', registerUser);
router.post('/login' , loginUser);
router.get('/userInfo' , validateToken , userInfo);

module.exports = router;
