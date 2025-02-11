import process from "node:process";

const API_ID = Number.parseInt(process.env.API_ID!);
const API_HASH = process.env.API_HASH!;
const CANNEL_ID = Number.parseInt(process.env.CANNEL_ID!);

if (Number.isNaN(API_ID) || !API_HASH) {
  throw new Error("API_ID or API_HASH not set!");
}

export { API_HASH, API_ID, CANNEL_ID };
