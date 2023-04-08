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
	const token = authorization.split(" ")[1];
	try {
		const decoded = await verifyAuth0Token(token, options);
		if (decoded === undefined) {
			return null;
		}
		if (isJwtPayload(decoded)) {
			return (decoded as JwtPayload).sub
		} else {
			return null
		}
	} catch (error) {
		return null;
	}
}
