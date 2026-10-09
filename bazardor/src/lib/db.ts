import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing.");

const cached = globalThis as typeof globalThis & {
  bazardorMongo?: MongoClient;
};

export const mongoClient =
  cached.bazardorMongo ??
  new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
  });

if (process.env.NODE_ENV !== "production") {
  cached.bazardorMongo = mongoClient;
}

export const db = mongoClient.db(process.env.MONGODB_DB || "bazardor");
