import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import  jwt from "jsonwebtoken"
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true,"Password is Required"],
      minlength: 6,
    },

    refreshToken: {
      type: String,
    },

    avatar: {
      type: String,
      default: "", // Cloudinary URL
    },

    coverImage: {
      type: String,
      default: "", // Cloudinary URL
    },

    watchHistory: [
      {
        videoId: {
          type: Schema.Types.ObjectId,
          ref: "Video",  // The ref: "Video" part is used to create a reference to another Mongoose model — in this case, the Video model.
        }, // "This videoId field stores the _id of a document from the Video collection."
        watchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);
  userSchema.pre("save",async function (next) {

    if(!this.isModified("password")) {
       return next() ;
    }
     this.password = await bcrypt.hash(this.password,12)  // rounds of encryption 
    next() ;
  })

userSchema.methods.isPasswordCorrect = async function (password) {
 return  await bcrypt.compare(password,this.password) ;
}
 // using JWT for stateless auth  if user is loggedin , via access and refresh tokens 

  userSchema.methods.generateAccessTokens =  function () {   // generate a short lived access token
    return jwt.sign({
_id : this._id , 
 email: this.email , 
 userName : this.userName ,
   fullName : this.fullName
     } ,
      process.env.ACCESS_TOKEN_SECRET , {expiresIn : process.env.ACCESS_TOKEN_EXPIRY} )  // In JWT (JSON Web Token), the secret is a private string known only to your server, used to sign and verify the token.
// Since the payload is different (userId), each user gets a unique token, but they’re all validated with the same key.
      
  }
    userSchema.methods.generateRefreshTokens =  function () {   // generate a short lived access token
    return jwt.sign({
_id : this._id    // payload 
     } ,
      process.env.REFRESH_TOKEN_SECRET , {expiresIn : process.env.REFRESH_TOKEN_EXPIRY} )  // In JWT (JSON Web Token), the secret is a private string known only to your server, used to sign and verify the token.
// Since the payload is different (userId), each user gets a unique token, but they’re all validated with the same key.
      
  }

// Export the model
export const User = mongoose.model("User", userSchema);
