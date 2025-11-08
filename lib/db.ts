import mongoose from 'mongoose';

let conn: typeof mongoose | null = null;

export async function dbConnect() {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'socialmm' });
  return conn;
}

export default async function connectDB() {
  return dbConnect();
}
