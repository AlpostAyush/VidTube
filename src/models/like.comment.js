import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
    likedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
); 
 likeSchema.plugin(mongooseAggregatePaginate) ;

export const Like = mongoose.model("Like", likeSchema);
