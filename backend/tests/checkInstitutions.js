import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

await db.collection('institutions').updateMany(
  { name: { $regex: 'SRM Medical College Hospital & Research Centre', $options: 'i' }, latitude: { $eq: null } },
  { $set: { campus: 'Kattankulathur', city: 'Kattankulathur', latitude: 12.8230, longitude: 80.0444 } }
);

const srmAndSaveetha = await db.collection('institutions').find({
  name: { $regex: 'srm|saveetha', $options: 'i' }
}).toArray();

console.log('All SRM & Saveetha Institutions:');
srmAndSaveetha.forEach(i => console.log(JSON.stringify({
  name: i.name,
  campus: i.campus,
  city: i.city,
  lat: i.latitude,
  lng: i.longitude
})));

process.exit(0);
