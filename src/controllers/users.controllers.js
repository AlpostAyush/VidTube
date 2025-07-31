import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary, deletefromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import logger from '../utils/logger.js';
import mongoose from 'mongoose';



 const generateAccessandRefreshToken =async (userId)=>{
 try {
  const user = await User.findById(userId) ;
 
   if(!user){
       throw new ApiError(400 , "Error finding User ") ;
   }
    const accessToken = await  user.generateAccessTokens()
       const refreshToken  = await   user.generateRefreshTokens()
         user.accessToken = accessToken ;
           user.refreshToken = refreshToken ;
           await user.save(({
             validateBeforeSave : 0
           }))
             return {accessToken,refreshToken} ;
 } catch (error) {
       throw new ApiError(500 , "Something went wrong while generating access and refresh tokens ") ;
 }

 } ;


 
// Debug endpoint to get all users
const getAllUsers = asyncHandler(async (request, response) => {
  try {
    const users = await User.find({}).select('-password -refreshToken');
    
    console.log(` Found ${users.length} users in database`);
    
    return response.status(200).json(new ApiResponse(
      200,
      {
        totalUsers: users.length,
        users: users
      },
      `Retrieved ${users.length} users successfully`
    ));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new ApiError(500, 'Failed to fetch users');
  }
});

const registeredUser = asyncHandler(async (request, response) => {
  // Debug: Log what we're receiving
  console.log('Request body:', request.body);
  console.log('Request files:', request.files); // comes from multer 
  
  const { fullName, email, userName, password } = request.body;

  console.log('Extracted values:', { fullName, email, userName, password });

  if ([fullName, userName, email, password].some(field => !field?.trim())) {
    console.log('Missing fields detected');
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarFile = request.files?.avatar?.[0];
  const coverImageFile = request.files?.coverImage?.[0];

  if (!avatarFile) {
    throw new ApiError(400, "Avatar image is required");
  }

  let avatar,coverImage;

  try {
    console.log('Uploading avatar to Cloudinary...');
    avatar = await uploadOnCloudinary(avatarFile.path);
    
    if (!avatar) {
      throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }
    
    console.log('Avatar uploaded successfully:', avatar.url);
    
    if (coverImageFile) {
      console.log('Uploading cover image to Cloudinary...');
      coverImage = await uploadOnCloudinary(coverImageFile.path);
      
      if (!coverImage) {
        throw new ApiError(500, "Failed to upload cover image to Cloudinary");
      }
      
      console.log('Cover image uploaded successfully:', coverImage.url);
    }

    console.log('Creating user with data:', {
      fullName,
      email,
      userName: userName.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    const user = await User.create({
      fullName,
      email,
      password,
      userName: userName.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    console.log(' User created in MongoDB:', user._id);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    console.log(' Retrieved user from MongoDB:', createdUser);

    return response.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    // Cleanup Cloudinary uploads if user creation fails
    if (avatar) {
      await deletefromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deletefromCloudinary(coverImage.public_id);
    }
    throw error; // Re-throw the error to be caught by the asyncHandler
  }
});
    


 const loginUser = asyncHandler(async (request , response)=>{
    const  {email,userName ,password } = request.body ;
      if(!email){ 
         throw new ApiError(400 , "Email is required for logging in ") ;
      }
        const user = await User.findOne({ $or: [{ userName }, { email }] });
          if(!user){
              throw new ApiError(404 , "User not found ! ") ;
          }
            
          const isPasswordCorrect  = await user.isPasswordCorrect(password) ;

           if(!isPasswordCorrect){
              throw new ApiError(401 , "Invalid Credentials") ;
           }
             const {accessToken ,refreshToken} = await generateAccessandRefreshToken(user._id) ;
             const loggedinUser =  await User.findById(user._id).select("-password -refresh-Token") ;
              if(!loggedinUser){
                throw new ApiError(501 , "It's  not you , It's from us 😘" ) ;
              }
                const options = {
                    httpOnly: true , 
                     secure : process.env.NODE_ENV === 'production' ,
                }
                   return response
                   .status(200)
                   .cookie("accessToken",accessToken,options)
                   .cookie("refreshToken",refreshToken,options)
                   .json(new ApiResponse(200 , "User loggedin Successfully")) ;
         

 }) ;


 const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
      req.user._id ,{
      $set :{
        refreshToken:undefined
      }
    }, 
     { new : true }
    ) ;
      const options = {
                        httpOnly : true , 
                         secure : process.env.NODE_ENV === 'production'
                      }
                       return res.status(200)
                       .clearCookie("accessToken",options)
                       .clearCookie("refreshToken",options)
                       .json(new ApiResponse(200,{},
                         "User logged out Successfully")) ;
  }) ;


  const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body ; 
      
    const user = await User.findById(req.user?._id) ;
     const isPasswordValid = await user.isPasswordCorrect(oldPassword) ;
     if(!isPasswordValid){
       throw new ApiError(401 , "wrong password") ;
     }
       user.password = newPassword ; 
        await user.save({validateBeforeSave:false}) ; 
         return res.status(200)
         .json(new ApiResponse(200,{} ,
           "Password changes Successfully"
         )) ;
  }) ;
 

  const getCurrentUser = asyncHandler(async (req,res)=>{
       return res.status(200)
         .json(new ApiResponse(200,req.user ,
           "Current user details"
         )) ;
  }) ;




    const updateUserAvatar = asyncHandler(async (req,res)=>{
       const avatarLocalPath =  req.files?.path ; 
         if(!avatarLocalPath){
           throw new ApiError(401 , "Avatar File is missing") ;
         }
         const avatar = await uploadOnCloudinary(avatarLocalPath) ;
          if(!avatar.url){
               throw new ApiError(500 , "Something went wrong") ;
          }

          const user = await User.findByIdAndUpdate( req.user?._id ,{
             $set :{
               avatar : avatar.url
             } 
          }
        , {
           new:true 
          }
            ).select("-password -refreshToken ")
               return res.status(200).json(new ApiResponse(200, {} , 
                   "New  Avatar uploaded successfully ! "
               )) ;
  }) ;

  
    const updateUserCoverImage = asyncHandler(async (req,res)=>{
      const coverImageLocalPath =  req.files?.path ; 
         if(!coverImageLocalPath){
           throw new ApiError(401 , "Cover Image File is missing") ;
         }
         const coverImage = await uploadOnCloudinary(coverImageLocalPath) ;
          if(!coverImage.url){
               throw new ApiError(500 , "Something went wrong") ;
          }

          const user = await User.findByIdAndUpdate( req.user?._id ,{
             $set :{
               avatar : coverImage.url
             } 
          }
        , {
           new:true 
          }
            ).select("-password -refreshToken ")
               return res.status(200).json(new ApiResponse(200, {} , 
                   "New Cover Image uploaded successfully ! "
               )) ;
  }) ;

  
    const updateAccountDetails = asyncHandler(async (req,res)=>{
       const {fullName , email}  = req.body 
         if(!fullName || !email){
            throw new ApiError(400 ,  "some account fields are missing")
         }


          User.findByIdAndUpdate(req.user?._id ,{
             $set: {
              fullName ,
              email : email.toLowerCase()
             }
          } ,
          {
            new:true 
          }).select("-password -refreshToken") ;

           
           return res.status(200).json(new ApiResponse(200 , user, "Account details updated successfully" )) ;
          
          
   }) ;

  
   
  

// get user channel profile 
   const getUserChannelProfile = asyncHandler(async (req,res)=>{
     const {userName} = req.params ;
     
      if(!userName?.trim()){
        throw new ApiError(400 , "user name is required") ;
      }
        const channel = await User.aggregate(
          [
          {
            $match :{      // aggregate pipeline
               userName : userName?.toLowerCase()     // field to which the filter has to be applied
            }
          } , 
          {
            $lookup :{
               from : "subscriptions" ,
                localField:"_id" ,
                 foreignField : "channel", 
                  as: "subscribers" 
            }
          } , 
          {
              $lookup :{
                  from : "subscriptions" ,
                localField:"_id" ,
                 foreignField : "subscriber", 
                  as: "subscriberOf" 
              }
          } ,
          {
            $addFields:{
              subscribersCount:{
                $size : '$subscribers'
              } ,
              channelSubscribedToCount: {
                 $size:"subscriberOf"
              }, 
              isSubscribed :{
               $cond :{
                  if:{
                      $in:[req.user?._id,"$subscribers.subscriber"]
                  } , 
                   then : true ,
                   else: false 
               }
            }
            }, 
            
          } ,
          {
          $project :{
             fullName : 1 , 
              userName :1 , 
               avatar :1 , 
               subscribersCount :1 , 
                channelSubscribedToCount :1 , 
                isSubscribed:1 , 
                coverImage :1 , 
                email :1 ,        
           }   
          }
        ])
         if(!channel.length){
           throw new ApiError(401 , "Channel not found") ;
         } 
           return new ApiResponse(200 , channel[0] , " Channel profile fetched successfully" ) ;
       
   }) ;


 const getUserWatchHistory = asyncHandler(async (req,res)=>{
     const user = await User.aggregate([
      {
        $match: {
          _id : new mongoose.Types.ObjectId(req.user?._id)
        }
      } , 
      {
         $lookup :{
            from : "videos",  
             localField : "watchHistory" ,
               foreignField : "_id" , 
                as : "watchHistory" , 
                 pipeline:[
                  {
                    $lookup:{
                      from  : "user" , 
                       localField : "owner" , 
                        foreignField : "_id" , 
                         as : "owner",
                          pipeline :[
                            {
                              $project :{
                                fullName :1 , 
                                 userName:1 , 
                                  avatar:1
                              }
                            }
                          ]
                    }
                  } ,
                  {
                    $addFields:{
                        owner :{
                           $first :"owner"
                        }
                    }
                  }
                ]
         }
      }
     ])
       
       return  res.status(200)
       .json(
        new ApiResponse(200 , user[0].watchHistory ,"Watch History fetched successfully") 
       ) ;
 }) ;




 // Generate new Access and Refresh Tokens
 
   const refreshAccessToken =  asyncHandler(async (req,res)=>{
      const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken ;   // expired refresh tokens may be recieved by the server via http only secure  cookies or request body (for apps)
           if(!incomingRefreshToken){
              throw new ApiError(401 , "Refresh token is Required") ;
           }
             try{
                const decodedToken = jwt.verify(
                  incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET 
                ) ; 
                 const user = await User.findById(decodedToken?._id) ;

                   if(!user){
                       throw new ApiError(401 , "Invalid Refresh Token") ;
                   }

                     if(user?.refreshToken !== incomingRefreshToken){
                       throw new ApiError(401 , "Invalid Refresh Token") ;  // token  expired
                     }
                      const options = {
                        httpOnly : true , 
                         secure : process.env.NODE_ENV === 'production'
                      }
                       const {accessToken , refreshToken :newRefreshToken } =await generateAccessandRefreshToken(user._id) ;
                         return response
                   .status(200)
                   .cookie("accessToken",accessToken,options)  //we're setting HTTP-only cookies so they are sent automatically with every request to your server.
                   .cookie("refreshToken",newRefreshToken,options)
                   .json(new ApiResponse(200 , {accessToken ,refreshToken:newRefreshToken}   , "Access Token refreshed Successfully" )) ;

             }  catch(err){ 
               
             }
   }) ;
  
 export default {
  registeredUser,
  getAllUsers,
  loginUser ,
  logoutUser,
  refreshAccessToken , 
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getCurrentUser,
  changeCurrentPassword ,
   getUserChannelProfile ,
    getUserWatchHistory
};
