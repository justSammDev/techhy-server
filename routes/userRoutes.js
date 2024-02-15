const experss = require("express");
const userController = require("../controllers/userController");

const router = experss.Router();

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createNewUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
