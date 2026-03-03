import mongoose from "mongoose";

let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    // console.log("Using existing connection");
    return;
  }

  const db = await mongoose.connect(process.env.MONGODB_URI);

  isConnected = db.connection.readyState >= 1;
  // console.log("Connection to DB established");
}
// const dbConnect = async () => {
//   if (mongoose.connection.readyState >= 1) {
//     return;
//   }

//   return mongoose.connect(process.env.MONGODB_URI);
// };

export default dbConnect;
