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

	const { id } = <{ id: string }>request.query;
    if (id === undefined) {
        response.status(400).json({ error: new Error("watering id needs to be defined") });
    }

    const { data, error } = await supabase
        .from("trees_watered")
        .select("*")
        .eq("watering_id", id);
    const innerResult = (data && data.length > 0 && tokenSubject === data[0].uuid) && data[0]

	checkDataError({
		data: innerResult,
		error,
		response,
		errorMessage: "no watering found for id",
	});
	const result = setupResponseData({
		url: request.url,
		data: innerResult,
		error,
	});
	return response.status(200).json(result);
}
