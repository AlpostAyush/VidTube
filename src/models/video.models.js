import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
 {
  videoFile : {
     type :String , 
     required : 1 
  } , 
   thumbnail : { 
     type : String , 
      required : true 
   } , 
      title : {
         type : String , 
      required : true 
      } , 
      description  : {
         type : String , 
      required : true 
      } , 
       views :{
         type : Number , 
           default:0 , 
       } , 
       isPublished : {
         type : Number , 
          default : true 
       } , 
        owner : {
            type : Schema.Types.ObjectId ,
             ref : 'User'
        }
 } , 

  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);
  videoSchema.plugin(mongooseAggregatePaginate) ;
   

// Export the model
export const Video = mongoose.model("Video", videoSchema);
