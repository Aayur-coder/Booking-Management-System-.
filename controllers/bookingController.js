import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  const booking = await Booking.create(req.body);
  res.json(booking);
};

export const getBookings = async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
};