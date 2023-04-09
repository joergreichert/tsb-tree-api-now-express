import { VercelRequest, VercelResponse } from "@vercel/node";
import { checkDataError } from "../../../_utils/data-error-response";
import { setupResponseData } from "../../../_utils/setup-response";
import { supabase } from "../../../_utils/supabase";

export default async function handler(
	request: VercelRequest,
	response: VercelResponse
) {
	const { start, end } = <{ start: string, end: string }>request.query;
    if (start === undefined || end === undefined) {
        response.status(400).json({ error: "start and end need to be defiend" });
    }
    if (parseInt(end, 10) < parseInt(start, 10)) {
        response.status(400).json({ error: "end cannot be smaller then start" });
    }
    const { data, error } = await supabase
		.from("trees")
		.select("id")
		.gte("pflanzjahr", parseInt(start, 10))
        .lte("pflanzjahr", parseInt(end, 10));
    const actualData = data?.map(elem => elem.id)    

	const errorResult = checkDataError({
		data: actualData,
		error,
		response,
		errorMessage: "issues when filtering trees by age",
	});
	if (errorResult) return errorResult
	const result = setupResponseData({
		url: request.url,
		data: actualData,
		error,
	});
	return response.status(200).json(result);
}
