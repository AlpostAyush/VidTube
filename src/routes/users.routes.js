import {Router} from 'express'; 
import {userController,logoutUser,loginUser,refreshAccessToken,updateUserAvatar,updateAccountDetails,changeCurrentPassword ,getUserChannelProfile,getUserWatchHistory } from '../controllers/users.controllers.js';
import verifyJWT from '../middlewares/auth.middlewares.js';





const { registeredUser, getAllUsers } = userController;

     import { upload } from '../middlewares/multer.middlewares.js';
         const router  = Router() ;

// Registration route
router.route('/register').post( upload.fields([
  {name : 'avatar', maxCount: 1}, 
  {name : "coverImage", maxCount: 1}
]), registeredUser);

// Debug route to get all users
router.route('/all').get(getAllUsers);
router.route('/login').post(loginUser) ;
router.route('refresh-token').post(refreshAccessToken) ;

  // secured routes  (via JWT)
router.route("/logout").post(verifyJWT , logoutUser) ;    // add multiple controllers for any route 
router.route("/change-password").post(verifyJWT , changeCurrentPassword) ; 
router.route("current-user").get(verifyJWT , getCurrentUser)  // user details
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/updateAccountDetails").patch(verifyJWT,updateAccountDetails) ;
router.route("/avatar").patch(verifyJWT , upload.single("avatar") ,updateUserAvatar)
router.route("/coverImage").patch(verifyJWT , upload.single("coverImage") ,updateUserCoverImage)
router.route("/history").get(verifyJWT ,getUserWatchHistory )

  

export default router;
   