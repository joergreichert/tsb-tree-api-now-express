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
    const { count, error } = await supabase
		.from("trees")
		.select("id", { count: 'exact' })
		.gte("pflanzjahr", parseInt(start, 10))
        .lte("pflanzjahr", parseInt(end, 10));

	checkDataError({
		data: count,
		error,
		response,
		errorMessage: "issues when counting trees by age",
	});
	const result = setupResponseData({
		url: request.url,
		data: count,
		error,
	});
	return response.status(200).json(result);
}
