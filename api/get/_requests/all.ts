import { VercelRequest, VercelResponse } from "@vercel/node";
import { checkDataError } from "../../../_utils/data-error-response";
import {
	checkLimitAndOffset,
	getLimitAndOffeset,
} from "../../../_utils/limit-and-offset";
import { getRange } from "../../../_utils/parse-content-range";
import { setupResponseData } from "../../../_utils/setup-response";
import { supabase } from "../../../_utils/supabase";
import { verifyRequest } from "../../../_utils/verify";
import { getEnvs } from "../../../_utils/envs";
import { checkRangeError } from "../../../_utils/range-error-response";
import { createLinks } from "../../../_utils/create-links";
const { SUPABASE_URL } = getEnvs();
export default async function handler(
	request: VercelRequest,
	response: VercelResponse
) {
	const authorized = await verifyRequest(request);
	if (!authorized) {
		return response.status(401).json({ error: "unauthorized" });
	}

	const limitResult = checkLimitAndOffset(request, response);
	if (limitResult) return limitResult
	const { limit, offset } = getLimitAndOffeset(request.query);
	const { range, error: rangeError } = await getRange(
		`${SUPABASE_URL}/rest/v1/trees`
	);
	const rangeResult = checkRangeError(response, rangeError, range);
	if (rangeResult) return rangeResult

//    t.*, g.german_label as gattungdeutsch,
//    g.wikipedia as gattungwikipedia, g.wikidata as gattungwikidata, g.wikicommons as gattungwikicommons,
//    s.wikipedia as artwikipedia, s.wikidata as artwikidata, s.wikicommons as artwikicommons, t.notes as notes
//    FROM trees t
//    LEFT OUTER JOIN trees_metadata g ON t.gattung = g.latin_name AND g.category_type = 'genus'
//    LEFT OUTER JOIN trees_metadata s ON t.artbot = s.latin_name AND s.category_type = 'species'

	const { data, error } = await supabase
		.from("trees")
		.select("id")
		.range(offset, offset + (limit - 1))
		.order("id", { ascending: true });
	const errorResult = checkDataError({
		data,
		error,
		response,
		errorMessage: "trees not found",
	});
	if (errorResult) return errorResult
	type TreeArray = NonNullable<typeof data>;
	const links = createLinks({
		limit,
		offset,
		range,
		type: "all",
		method: "get",
		requestUrl: request.url ?? "",
	});
	const result = setupResponseData({
		url: request.url,
		data: (data as TreeArray).map((tree) => tree.id),
		error,
		links,
		range,
	});

	return response.status(200).json(result);
}
