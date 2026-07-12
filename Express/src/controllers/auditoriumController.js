const Auditorium = require('../models/auditorium');
const Seat = require('../models/seat');

const createAuditorium = async (req, res) => {
    try {
        const { name, totalRows, totalColumns } = req.body;
        if (!name || !totalRows || !totalColumns) {
            return res.status(400).json({ success: false, message: 'All fields (name, totalRows, totalColumns) are required' });
        }

        const seatCount = totalRows * totalColumns;
        const auditorium = new Auditorium({
            name,
            totalRows,
            totalColumns,
            seatCount
        });

        await auditorium.save();
        return res.status(201).json({ success: true, message: 'Auditorium created successfully', data: auditorium });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllAuditoriums = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find();
        return res.status(200).json({ success: true, data: auditoriums });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAuditoriumById = async (req, res) => {
    try {
        const auditorium = await Auditorium.findById(req.params.id);
        if (!auditorium) {
            return res.status(404).json({ success: false, message: 'Auditorium not found' });
        }
        return res.status(200).json({ success: true, data: auditorium });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateAuditorium = async (req, res) => {
    try {
        const { name, totalRows, totalColumns, status } = req.body;
        let updateData = { name, status };
        
        if (totalRows && totalColumns) {
            updateData.totalRows = totalRows;
            updateData.totalColumns = totalColumns;
            updateData.seatCount = totalRows * totalColumns;
        }

        const auditorium = await Auditorium.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!auditorium) {
            return res.status(404).json({ success: false, message: 'Auditorium not found' });
        }
        return res.status(200).json({ success: true, message: 'Auditorium updated successfully', data: auditorium });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAuditorium = async (req, res) => {
    try {
        const auditorium = await Auditorium.findByIdAndDelete(req.params.id);
        if (!auditorium) {
            return res.status(404).json({ success: false, message: 'Auditorium not found' });
        }
        
        await Seat.deleteMany({ auditorium: req.params.id });
        
        const Showtime = require('../models/showtime');
        await Showtime.deleteMany({ auditorium: req.params.id });
        
        return res.status(200).json({ success: true, message: 'Auditorium and its seats deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAuditorium,
    getAllAuditoriums,
    getAuditoriumById,
    updateAuditorium,
    deleteAuditorium
};
