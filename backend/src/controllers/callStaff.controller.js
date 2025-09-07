import { handleCallStaff } from '../services/callStaff.service.js';

export const callStaff = async (req, res) => {
    try {
        const response = await handleCallStaff();
        res.status(200).json({ message: response });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
