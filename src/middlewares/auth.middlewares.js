import { jwt } from "jsonwebtoken";
import {User} from "../models/user.models"
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";


 export const verifyJWT = asyncHandler(async(req,_ , next)=>{  // response is not required rather use _ as a placeholder 
      const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ","") ;
      if(!token){
         throw new ApiError(401 , "UnAuthorized") ;
      }
      
        try{
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
         const user = await User.findById(decodedToken?._id).select("-password -refreshToken") ; 
            if(!user){
                  throw new ApiError(401 , "UnAuthorized") ;
            }
             req.user = user ;  // create a new parameter in the request body

               next() ;
              

        }  catch(err){
             throw new ApiError(401 , 
                err?.message || "Invalid Access token"
             ) ;
        }
 }) ;

  export default verifyJWT ;