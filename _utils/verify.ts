import { VercelRequest } from "@vercel/node";
import {
	JwtPayload,
} from "jsonwebtoken";
import { options, verifyAuth0Token } from "./verify-token";

function isJwtPayload(obj: any): obj is JwtPayload {
	return 'sub' in obj;
}

export async function verifyRequest(request: VercelRequest) {
	const { authorization } = request.headers;
	if (!authorization) {
		return null;
	}
	const segments = authorization.split(" ")
	if (segments.length < 1) {
		console.log(`token segments length not > 1: ${segments.length}`)
		return null;
	}
	const token = segments[1];
	try {
		const decoded = await verifyAuth0Token(token, options);
		if (decoded === undefined) {
			console.log(`decoded is undefined`)
			return null;
		}
		if (isJwtPayload(decoded)) {
			const sub = (decoded as JwtPayload).sub;
			console.log(`JWT sub is ${sub}`)
			return sub;
		} else {
			console.log(`decoded is ${typeof decoded}`)
			return null
		}
	} catch (error) {
		console.log(`error: ${JSON.stringify(error, null, 2)}`)
		return null;
	}
}
