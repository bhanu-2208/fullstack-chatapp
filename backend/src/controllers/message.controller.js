import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar=async(req,res)=>{
    try{
        const user=req.user._id;
        const filteredusers=await User.find({_id:{$ne:user._id}}).select("-password")
        res.status(200).json(filteredusers);
    }
    catch(error){
        console.log("Error in getUsersForSidebar: ",error.message);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getMessages=async(req,res)=>{
    try{
        const senderId=req.user._id;
        const {id}=req.params;
        const recieverId=id;

        const messages=await message.find({
            $or:[
                {senderId:senderId,recieverId:recieverId},
                {senderId:recieverId,recieverId:senderId}
            ]
        })
        res.status(200).json(messages);
    }
    catch(error){
        console.log("Error in getMessages: ",error.message);
        res.status(500).json({error:"Internal server error"})
    }
}

export const sendMessage=async(req,res)=>{
    try{
        const senderId=req.user._id;
        const recieverId=req.params.id;
        const {text,image}=req.body;

        let imageUrl;
        if(image){
            const uploadImage=await cloudinary.uploader.upload(image);
            imageUrl=uploadImage.secure_url
        }

        const newMessage=new message({
            senderId,
            recieverId,
            text,
            image:imageUrl
        });

        await newMessage.save();
 
        //real time functionality goes here ==> socket.io
        const receiverSocketId=getReceiverSocketId(recieverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.status(200).json(newMessage)

    }
    catch(error){
        console.log("Error in sendMessage: ",error.message);
        res.status(500).json({error:"Internal server error"})
    }
}