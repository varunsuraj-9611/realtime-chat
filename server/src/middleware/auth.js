import jwt from "jsonwebtoken";
export function verifyToken(token){ return jwt.verify(token,process.env.JWT_SECRET); }
export function auth(req,res,next){ try{const t=req.headers.authorization?.replace("Bearer ","");req.user=verifyToken(t);next()}catch{res.status(401).json({message:"Unauthorized"})}}
