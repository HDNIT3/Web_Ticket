const SeatType = require('../models/seatType');
const Seat = require('../models/seat');

const getAllSeatTypes = async (req, res) => {
    try {
        const seatTypes = await SeatType.find();
        

        const seatCounts = await Seat.aggregate([
            { $group: { _id: '$seatType', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        seatCounts.forEach(c => { countMap[c._id.toString()] = c.count; });
        
        const mapped = seatTypes.map(st => {
            const usedSeatCount = countMap[st._id.toString()] || 0;
            return {
                ...st.toObject(),
                usedSeatCount,
                deletable: usedSeatCount === 0
            };
        });
        
        return res.status(200).json({ success: true, data: mapped });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createSeatType = async (req, res) => {
    try {
        const { name, surchargeAmount, description } = req.body;
        const newSeatType = await SeatType.create({ name, surchargeAmount, description });
        return res.status(201).json({ success: true, data: newSeatType });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateSeatType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surchargeAmount, description } = req.body;
        const updated = await SeatType.findByIdAndUpdate(id, { name, surchargeAmount, description }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'SeatType not found' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSeatType = async (req, res) => {
    try {
        const { id } = req.params;
        const usedCount = await Seat.countDocuments({ seatType: id });
        if (usedCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete SeatType because it is currently used by seats.' });
        }
        const deleted = await SeatType.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'SeatType not found' });
        return res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSeatTypes, createSeatType, updateSeatType, deleteSeatType };
