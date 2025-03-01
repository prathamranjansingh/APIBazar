import { randomBytes } from "crypto";

export const generateApiKey = () => {
    return randomBytes(32).toString("hex");
};
