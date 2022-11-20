import { APP_SECRET } from "../constants";

export interface Token {
  id: number;
  name: string;
  timestamp: Date;
  exp?: Date;
}

export const tokens = {
  secret: APP_SECRET,
  expiry: "1y",
  name: "app-tokeno",
};
