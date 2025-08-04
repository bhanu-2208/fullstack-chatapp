import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        if(!token){
            return res.status(401).json({message:"Unauthorized - No token Provided"})
        }
        let verifiedtoken=jwt.verify(token,process.env.JWT_SECRETKEY);
        const user=await User.findById(verifiedtoken.userId).select("-password")

        if(!user){
            return res.status(401).json({message:"user not found"})
        }

        req.user=user

        next();
    }
    catch(error){
        console.log("Error in protecting middleware: ",error.message);
        res.status(401).json({message:"Internal server error"})
    }
}