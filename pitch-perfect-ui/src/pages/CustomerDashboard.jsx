import { useState, useEffect } from 'react';
import API from '../services/api';

export default function CustomerDashboard() {
    const [pitches, setPitches] = useState([]);
    const [bookingData, setBookingData] = useState({ pitchId: null, startTime: '', endTime: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchPitches = async () => {
            try {
                const response = await API.get('/pitches/search');
                setPitches(response.data.content || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPitches();
    }, []);

    const handleBook = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await API.post('/bookings', {
                pitchId: bookingData.pitchId,
                userId: 1, // Hardcoded for demo purposes
                startTime: new Date(bookingData.startTime).toISOString(),
                endTime: new Date(bookingData.endTime).toISOString()
            });
            setMessage({ type: 'success', text: 'Booking confirmed successfully!' });
            setBookingData({ pitchId: null, startTime: '', endTime: '' }); // Reset
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to book pitch' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Available Pitches</h1>

            {message && (
                <div className={`p-4 rounded mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pitches.map(pitch => (
                    <div key={pitch.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-blue-600 h-24 flex items-center justify-center text-white font-bold text-xl">
                            {pitch.name}
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600 mb-2">📍 {pitch.location}</p>
                            <p className="font-bold text-lg mb-4 text-blue-600">${pitch.pricePerHour} / hour</p>

                            <form onSubmit={handleBook} className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Start Time</label>
                                    <input type="datetime-local" required className="w-full text-sm p-1 border rounded"
                                        onChange={(e) => setBookingData({ ...bookingData, pitchId: pitch.id, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">End Time</label>
                                    <input type="datetime-local" required className="w-full text-sm p-1 border rounded"
                                        onChange={(e) => setBookingData({ ...bookingData, pitchId: pitch.id, endTime: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded transition">
                                    Book Now
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}