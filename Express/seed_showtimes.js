require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./src/models/movie');
const Showtime = require('./src/models/showtime');

const connectDB = require('./src/config/configdb');

const seedShowtimes = async () => {
    try {
        await connectDB();
        
        const movies = await Movie.find({});
        if (movies.length === 0) {
            console.log("No movies found in the database. Please add movies first.");
            process.exit(0);
        }

        console.log(`Found ${movies.length} movies. Generating showtimes...`);

        const cinemas = ["CGV Vincom", "Lotte Cinema", "BHD Star", "Galaxy Cinema"];
        const halls = ["Hall 1", "Hall 2", "Hall 3", "Hall 4"];
        const languages = ['Vietsub', 'Thuyết minh', 'Lồng tiếng', 'Gốc'];
        const seatTypes = ['2D', '3D', 'IMAX', '4DX'];

        const newShowtimes = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            for (const movie of movies) {
                const numShowtimes = Math.floor(Math.random() * 2) + 2;

                for (let j = 0; j < numShowtimes; j++) {
                    const hour = 9 + Math.floor(Math.random() * 14); // 9 AM to 11 PM
                    const minute = Math.random() < 0.5 ? 0 : 30;
                    
                    const startTime = new Date(date);
                    startTime.setHours(hour, minute, 0, 0);

                    const durationInMinutes = movie.duration || 120;
                    const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

                    const cinema = cinemas[Math.floor(Math.random() * cinemas.length)];
                    const hall = halls[Math.floor(Math.random() * halls.length)];
                    const language = languages[Math.floor(Math.random() * languages.length)];
                    const seatType = seatTypes[Math.floor(Math.random() * seatTypes.length)];

                    newShowtimes.push({
                        movie: movie._id,
                        cinema: cinema,
                        hall: hall,
                        startTime: startTime,
                        endTime: endTime,
                        seatType: seatType,
                        price: 70000 + Math.floor(Math.random() * 5) * 10000, // 70k to 110k
                        totalSeats: 100,
                        availableSeats: 100 - Math.floor(Math.random() * 30), // Some seats booked
                        language: language,
                        status: 'AVAILABLE'
                    });
                }
            }
        }

        await Showtime.insertMany(newShowtimes);
        console.log(`Successfully seeded ${newShowtimes.length} showtimes!`);
        process.exit(0);
    } catch (error) {
        console.error("Error seeding showtimes:", error);
        process.exit(1);
    }
};

seedShowtimes();
