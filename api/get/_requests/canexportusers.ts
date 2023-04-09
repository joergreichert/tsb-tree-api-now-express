import { VercelRequest, VercelResponse } from "@vercel/node";
import { setupResponseData } from "../../../_utils/setup-response";
import { verifyRequest } from "../../../_utils/verify";

export default async function handler(
	request: VercelRequest,
	response: VercelResponse
) {
	const tokenSubject = await verifyRequest(request);
	if (!tokenSubject) {
		return response.status(401).json({ error: "unauthorized" });
	}
    let innerResult: any;
    if (tokenSubject === "auth0|5f29bb0c53a5990037970148"/*joerg*/ 
        || tokenSubject === "auth0|5f3bc85b4ee503006d6c041b"/*thorsten*/) {
        innerResult = true;
    } else {
        innerResult = false;
    }

	const result = setupResponseData({
		url: request.url,
		data: innerResult,
		error: null,
	});
	return response.status(200).json(result);
}
