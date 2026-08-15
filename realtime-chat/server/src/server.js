import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import { auth, verifyToken } from "./middleware/auth.js";

const app=express(), server=http.createServer(app);
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5174"}));app.use(express.json());
const io=new Server(server,{cors:{origin:process.env.CLIENT_URL||"http://localhost:5174"}});
const tokenFor=u=>jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:"7d"});

app.post("/api/auth/register",async(req,res)=>{
  try{const {name,email,password}=req.body;if(await User.findOne({email}))return res.status(409).json({message:"Email already registered"});
  const u=await User.create({name,email,password:await bcrypt.hash(password,12)});res.status(201).json({token:tokenFor(u),user:{id:u._id,name:u.name,email:u.email}})}
  catch(e){res.status(500).json({message:e.message})}
});
app.post("/api/auth/login",async(req,res)=>{
  const u=await User.findOne({email:req.body.email});if(!u||!(await bcrypt.compare(req.body.password,u.password)))return res.status(401).json({message:"Invalid credentials"});
  res.json({token:tokenFor(u),user:{id:u._id,name:u.name,email:u.email}})
});
app.get("/api/users",auth,async(req,res)=>res.json(await User.find({_id:{$ne:req.user.id}}).select("name email online")));

app.post("/api/conversations",auth,async(req,res)=>{
  const members=[req.user.id,req.body.userId];let c=await Conversation.findOne({isGroup:false,members:{$all:members,$size:2}});
  if(!c)c=await Conversation.create({members});res.json(await c.populate("members","name email online"));
});
app.get("/api/conversations",auth,async(req,res)=>res.json(await Conversation.find({members:req.user.id}).populate("members","name email online").sort({updatedAt:-1})));
app.get("/api/messages/:conversationId",auth,async(req,res)=>res.json(await Message.find({conversation:req.params.conversationId}).populate("sender","name").sort({createdAt:1}).limit(100)));

io.use((socket,next)=>{try{socket.user=verifyToken(socket.handshake.auth.token);next()}catch{next(new Error("Unauthorized"))}});
io.on("connection",async socket=>{
  const uid=socket.user.id;await User.findByIdAndUpdate(uid,{online:true});
  io.emit("presence",{userId:uid,online:true});
  socket.on("join",id=>socket.join(String(id)));
  socket.on("typing",({conversationId,typing})=>socket.to(String(conversationId)).emit("typing",{userId:uid,typing}));
  socket.on("message",async({conversationId,text})=>{
    if(!text?.trim())return;
    const m=await Message.create({conversation:conversationId,sender:uid,text:text.trim(),readBy:[uid]});
    const full=await m.populate("sender","name");await Conversation.findByIdAndUpdate(conversationId,{updatedAt:new Date()});
    io.to(String(conversationId)).emit("message",full);
  });
  socket.on("read",async({conversationId})=>{
    await Message.updateMany({conversation:conversationId,readBy:{$ne:uid}},{$addToSet:{readBy:uid}});
    io.to(String(conversationId)).emit("read",{userId:uid});
  });
  socket.on("disconnect",async()=>{await User.findByIdAndUpdate(uid,{online:false});io.emit("presence",{userId:uid,online:false})});
});

mongoose.connect(process.env.MONGO_URI).then(()=>server.listen(process.env.PORT||6000,()=>console.log("Chat server running")));
