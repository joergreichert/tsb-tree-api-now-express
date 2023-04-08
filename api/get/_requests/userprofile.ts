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
	const { uuid } = <{ uuid: string }>request.query;
    if (uuid === undefined) {
        response.status(400).json({ error: new Error("uuid needs to be defined") });
    }
    if (tokenSubject !== uuid) {
        response.status(400).json({ error: new Error("You're only allowed to query your own user profile") });
    }
	const { data, error } = await supabase
		.from("users")
		.select("uuid, email, username, prefered_username, family_name, given_name, salutation, street_with_number, zipcode, phone_number")
		.eq("uuid", uuid);

	checkDataError({
		data,
		error,
		response,
		errorMessage: "user profile not found",
	});
	const result = setupResponseData({
		url: request.url,
		data,
		error,
	});
	return response.status(200).json(result);
}
