import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: String,
  resource: String,
  date: String,
  time: String
});

export default mongoose.model("Booking", bookingSchema);