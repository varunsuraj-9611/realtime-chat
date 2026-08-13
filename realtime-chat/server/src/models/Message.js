import mongoose from "mongoose";
export default mongoose.model("Message", new mongoose.Schema({
  conversation:{type:mongoose.Schema.Types.ObjectId,ref:"Conversation",index:true},
  sender:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  text:{type:String,required:true},
  readBy:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}]
},{timestamps:true}));
