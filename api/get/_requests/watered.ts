import { VercelRequest, VercelResponse } from "@vercel/node";
import { checkDataError } from "../../../_utils/data-error-response";
import { setupResponseData } from "../../../_utils/setup-response";
import { supabase } from "../../../_utils/supabase";

export default async function handler(
	request: VercelRequest,
	response: VercelResponse
) {
    const { data, error } = await supabase
		.from("trees_watered")
		.select("tree_id")
		.order("tree_id");
    const treeIds = data?.map(elem => elem.tree_id)
    const actualData = treeIds ? [...new Set(treeIds)] : [];

	const errorResult = checkDataError({
		data: actualData,
		error,
		response,
		errorMessage: "failed to retrieve ids of watered trees",
	});
	if (errorResult) return errorResult
	const result = setupResponseData({
		url: request.url,
		data: actualData,
		error,
	});
	return response.status(200).json(result);
}
