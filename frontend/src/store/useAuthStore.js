import {create} from 'zustand'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import {io} from 'socket.io-client'

const BASE_URL=import.meta.env.MODE === "development"?"http://localhost:5003" :"/"

export const useAuthStore=create((set,get)=>({
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket:null,

    checkAuth: async()=>{
        try{
            const res=await axiosInstance.get("/auth/check");
            set({authUser:res.data})
             get().connectSocket(); 
        }catch(error){
            set({authUser:null})
        }
        finally{
            set({isCheckingAuth:false})
        }
    },
    signup:async (data)=>{
        try{
            set({isSigningUp:true})
            const res=await axiosInstance.post("/auth/signup",data);
            toast.success("Account created successfully")
            set({authUser:res.data})

            get().connectSocket(); 
        }catch(error){
            toast.error(error.response.data.message)
        }finally{
            set({isSigningUp:false})
        }
    },
    login:async(data)=>{
        try{
            set({isLoggingIn:true})
            const res=await axiosInstance.post("/auth/login",data);
            set({authUser:res.data})
            toast.success("Logged In successfully")

            get().connectSocket()
        }catch(error){
            toast.error(error?.response?.data?.message || "Something went wrong. Please try again.");

        }finally{
            set({isLoggingIn:false})
        }
    },
    logout:async()=>{
        try{
            await axiosInstance.post("/auth/logout");
            set({authUser:null});
            toast.success("logged out successfully")
             get().disconnectSocket(); 
        }
        catch(error){
            toast.error(error.response.data.message)
        }
    },
    updateProfile:async(data)=>{
        set({isUpdatingProfile:true})
        try{
            const res=await axiosInstance.put("/auth/update-profile",data)
            set({authUser:res.data})
            toast.success("Profile updated successfully");
        }catch(error){
            console.log("error in update profile")
            toast.error(error.response.data.message)
        }finally{
            set({isUpdatingProfile:false})
        }
    },
    connectSocket:()=>{
        const {authUser} =get();
        if(!authUser || get().socket?.connected) return;
        const socket=io(BASE_URL,{
            withCredentials:true,
            query:{
                userId:authUser._id
            }
        });
        socket.connect();
        socket.emit("addUser", authUser._id);
        
        set({ socket: socket });

        socket.on("getOnlineUsers",(userIds)=>{
            set({onlineUsers:userIds})
        })
    },
    disconnectSocket:()=>{
        if(get().socket?.connected) get().socket.disconnect();
    }
}))