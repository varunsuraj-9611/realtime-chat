import mongoose from "mongoose";
export default mongoose.model("Conversation", new mongoose.Schema({
  name:String,isGroup:{type:Boolean,default:false},members:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}]
},{timestamps:true}));
