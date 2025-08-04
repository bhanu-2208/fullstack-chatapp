import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    console.log(req.body)
    try {
        let { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User with email already exists" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const token =await  generateToken(newUser._id,res); 
        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            token,
        });

    } catch (error) {
        console.error("Error in signup controller:", error.message);
        res.status(500).json({ message: "Server error during signup" });
    }
};

export const login=async(req,res)=>{
    try{
        let {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        let loginuser=await User.findOne({email});
        if(!loginuser){
            return res.status(400).json({message:"No user found with that email"});
        }
        let hashedPassword=await bcrypt.compare(password,loginuser.password)
        if(!hashedPassword){
            return res.status(400).json({message:"password is incorrect please chek your password"});
        }
        const token=generateToken(loginuser._id,res)
         res.status(201).json({
            _id: loginuser._id,
            fullName: loginuser.fullName,
            email: loginuser.email,
            token,
        });

    }catch(error){
        console.error("Error in login controller:", error.message);
        res.status(500).json({ message: "Server error during signup" });
    }
}

export const logout=(req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(201).json({message:"successfully logged out"});
    }catch(error){
        console.error("Error in logout controller:", error.message);
        res.status(500).json({ message: "Server error during signup" });
    }
}

export const updateProfile=async(req,res)=>{
    try{
        const {profilePic}=req.body;
        const userId=req.user._id;
        if(!profilePic){
            return res.status(400).json({message:"Profile pic is required"})
        }
        const uploadResponse=await cloudinary.uploader.upload(profilePic)

        const updateUser=await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true})

        res.status(200).json(updateUser)
    }
    catch(error){
        console.log("error in update profile",error.message);
        res.status(500).json({message:"internal error in updating profile"})
    }
}

export const checkAuth=(req,res)=>{
    try{
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        return res.status(200).json(req.user);
    }
    catch(error){
         console.log("error in checkAuth controller",error.message);
        res.status(500).json({message:"internal server error"})
    }
}