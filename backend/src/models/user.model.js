import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",  //eitar mane profile pic  dile o cholbe na dile o cholbe 
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
