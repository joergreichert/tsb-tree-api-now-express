import { VercelRequest, VercelResponse } from "@vercel/node";
import { Parser } from 'json2csv';
import { checkDataError } from "../../../_utils/data-error-response";
import { setupResponseData } from "../../../_utils/setup-response";
import { supabase } from "../../../_utils/supabase";
import { verifyRequest } from "../../../_utils/verify";

export default async function handler(
	request: VercelRequest,
	response: VercelResponse
) {
	const tokenSubject = await verifyRequest(request);
	if (!tokenSubject) {
		return response.status(401).json({ error: "unauthorized" });
	}
    if (tokenSubject !== "auth0|5f29bb0c53a5990037970148"/*joerg*/ 
        && tokenSubject !== "auth0|5f3bc85b4ee503006d6c041b"/*thorsten*/) {
		return response.status(400).json({ error: "You're not allowed to export the user data" });
    }

    const fields = [
        "email", "uuid", "username", "family_name", "given_name", "prefered_username", 
        "salutation", "street_with_number", "zipcode", "phone_number", "created",	"updated"
    ];
	const { data, error } = await supabase
		.from("users")
		.select(fields.join(", "))
    const json2csv = new Parser({ fields });
    const actualData = json2csv.parse(data);

	const errorResult = checkDataError({
		data: actualData,
		error,
		response,
		errorMessage: "user export failed",
	});
	if (errorResult) return errorResult
	const result = setupResponseData({
		url: request.url,
		data: actualData,
		error,
	});
	return response.status(200).json(result);
}
