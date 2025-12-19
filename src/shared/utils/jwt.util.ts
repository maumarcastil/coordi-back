import jwt from "jsonwebtoken";

import { loadEnvConfig } from "@infrastructure/config/env.config.js";

const config = loadEnvConfig();

export interface JwtPayload {
	userId: number;
	email: string;
}

export const generateToken = (payload: JwtPayload): string => {
	return jwt.sign(payload, config.jwtSecret, {
		expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
	});
};

export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
