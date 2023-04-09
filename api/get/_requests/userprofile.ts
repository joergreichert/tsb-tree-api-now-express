import { VercelRequest, VercelResponse } from "@vercel/node";
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
	const { data, error } = await supabase
		.from("users")
		.select("uuid, email, username, prefered_username, family_name, given_name, salutation, street_with_number, zipcode, phone_number")
		.eq("uuid", tokenSubject);

	const errorResult = checkDataError({
		data,
		error,
		response,
		errorMessage: "user profile not found",
	});
	if (errorResult) return errorResult
	const result = setupResponseData({
		url: request.url,
		data,
		error,
	});
	return response.status(200).json(result);
}
