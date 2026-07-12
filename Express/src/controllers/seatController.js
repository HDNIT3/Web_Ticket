const Seat = require('../models/seat');
const Auditorium = require('../models/auditorium');
const SeatType = require('../models/seatType');
const Showtime = require('../models/showtime');
const Ticket = require('../models/ticket');
const Booking = require('../models/booking');

const generateSeatsForAuditorium = async (req, res) => {
    try {
        const { auditoriumId } = req.params;
        const auditorium = await Auditorium.findById(auditoriumId);
        if (!auditorium) {
            return res.status(404).json({ success: false, message: 'Auditorium not found' });
        }

        let seatTypeId = req.body.seatTypeId;
        if (!seatTypeId) {
            let defaultType = await SeatType.findOne();
            if (!defaultType) {
                defaultType = await SeatType.create({
                    name: 'STANDARD',
                    description: 'Ghế tiêu chuẩn',
                    surchargeAmount: 0
                });
            }
            seatTypeId = defaultType._id;
        }

        const existingSeats = await Seat.countDocuments({ auditorium: auditoriumId });
        if (existingSeats > 0) {
            return res.status(400).json({ success: false, message: 'Seats already generated for this auditorium' });
        }

        const seats = [];
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let r = 1; r <= auditorium.totalRows; r++) {
            const rowLetter = alphabet[r - 1] || `R${r}`;
            for (let c = 1; c <= auditorium.totalColumns; c++) {
                seats.push({
                    name: `${rowLetter}${c}`,
                    rowIndex: r,
                    columnIndex: c,
                    auditorium: auditoriumId,
                    status: 'AVAILABLE',
                    seatType: seatTypeId
                });
            }
        }

        const createdSeats = await Seat.insertMany(seats);
        return res.status(201).json({ success: true, message: 'Seats generated successfully', data: createdSeats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllSeats = async (req, res) => {
    try {
        const seats = await Seat.find().populate('auditorium', 'name').populate('seatType', 'name surchargeAmount');
        return res.status(200).json({ success: true, data: seats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getSeatsByAuditorium = async (req, res) => {
    try {
        const { auditoriumId } = req.params;
        const seats = await Seat.find({ auditorium: auditoriumId }).sort({ rowIndex: 1, columnIndex: 1 }).populate('seatType', 'name surchargeAmount');
        return res.status(200).json({ success: true, data: seats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getSeatById = async (req, res) => {
    try {
        const seat = await Seat.findById(req.params.id).populate('auditorium', 'name').populate('seatType', 'name surchargeAmount');
        if (!seat) {
            return res.status(404).json({ success: false, message: 'Seat not found' });
        }
        return res.status(200).json({ success: true, data: seat });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateSeat = async (req, res) => {
    try {
        const { status, seatType } = req.body;
        const seat = await Seat.findByIdAndUpdate(req.params.id, { status, seatType }, { new: true });
        if (!seat) {
            return res.status(404).json({ success: false, message: 'Seat not found' });
        }
        return res.status(200).json({ success: true, message: 'Seat updated successfully', data: seat });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSeat = async (req, res) => {
    try {
        const seat = await Seat.findByIdAndDelete(req.params.id);
        if (!seat) {
            return res.status(404).json({ success: false, message: 'Seat not found' });
        }
        return res.status(200).json({ success: true, message: 'Seat deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getSeatsForShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({ success: false, message: 'Showtime not found' });
        }

        const auditoriumId = showtime.auditorium;
        
        // Fetch all seats in this auditorium, sorted by rowIndex and columnIndex
        const seats = await Seat.find({ auditorium: auditoriumId })
            .sort({ rowIndex: 1, columnIndex: 1 })
            .populate('seatType', 'name surchargeAmount');

        // Fetch all active tickets for bookings of this showtime (exclude CANCELLED bookings)
        const activeBookings = await Booking.find({ showtime: showtimeId, status: { $ne: 'CANCELLED' } }).distinct('_id');
        
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const activeTickets = await Ticket.find({
            booking: { $in: activeBookings },
            status: { $in: ['PAID', 'CHECKED_IN', 'LOCKED'] }
        });

        // Create a Map of seatId -> ticket status
        const seatStatusMap = new Map();
        activeTickets.forEach(ticket => {
            // Check if ticket is locked and has expired (older than 10 mins)
            if (ticket.status === 'LOCKED' && ticket.createdAt < tenMinutesAgo) {
                // Expired lock, treat as AVAILABLE
                return;
            }
            seatStatusMap.set(ticket.seat.toString(), ticket.status);
        });

        // Map seats and replace status field dynamically
        const mappedSeats = seats.map(seat => {
            const seatObj = seat.toObject ? seat.toObject() : seat;
            const seatIdStr = seatObj._id.toString();
            
            let currentStatus = 'AVAILABLE';
            if (seatStatusMap.has(seatIdStr)) {
                const statusVal = seatStatusMap.get(seatIdStr);
                currentStatus = (statusVal === 'PAID' || statusVal === 'CHECKED_IN') ? 'BOOKED' : statusVal;
            }
            
            return {
                ...seatObj,
                status: currentStatus
            };
        });

        return res.status(200).json({ success: true, data: mappedSeats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateSeatsForAuditorium,
    getAllSeats,
    getSeatsByAuditorium,
    getSeatById,
    updateSeat,
    deleteSeat,
    getSeatsForShowtime
};
