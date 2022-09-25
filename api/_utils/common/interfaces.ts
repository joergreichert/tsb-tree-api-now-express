import { BodyQueryType, RequestMethod } from "./types";

export interface Generic {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface PatchProp {
  name: string;
  value: string;
}
export interface RequestBody {
  queryType: BodyQueryType;
  tree_id?: string;
  watering_id?: string;
  uuid?: string;
  username?: string;
  amount?: number;
  timestamp?: string;
  patches?: PatchProp[];
  email?: string;
  ids?: string[];
}

export interface Tree {
  id: string;
  lat: string;
  lng: string;
  artdtsch: string;
  artbot: string;
  gattungdeutsch: string;
  gattung: string;
  strname: string;
  hausnr: string;
  zusatz: string;
  pflanzjahr: string;
  standalter: string;
  kronedurch: string;
  stammumfg: string;
  type: string;
  baumhoehe: string;
  bezirk: string;
  eigentuemer: string;
  adopted: unknown;
  watered: unknown;
  radolan_sum: number;
  radolan_days: number[];
  geom: string;
  gattungwikipedia: string;
  gattungwikidata: string;
  gattungwikicommons: string;
  artwikipedia: string;
  artwikidata: string;
  artwikicommons: string;
  notes: string;
}

export type TreeReduced = [string, number, number, number];
export interface AllTreesFiltered {
  watered: TreeReduced[];
}

export interface TreeWatered {
  amount: string;
  tree_id: string;
  updated: Date | string;
  uuid: string;
  timestamp: Date | string;
  username: string;
  watering_id: string;
}

export interface TreeAdopted {
  id: string;
  tree_id: string;
  uuid: string;
}
export interface TreeWateredAndAdopted {
  tree_id: string;
  adopted: string;
  watered: string;
}

export interface VerifiedReqCaseOption {
  name: string;
  queryType?: string;
  statusCode: number;
  data?: Generic;
  method: RequestMethod;
}

export interface VerifiedReqCaseOptionPOST extends VerifiedReqCaseOption {
  body?: Generic;
}
export interface VerifiedReqCaseOptionGET extends VerifiedReqCaseOption {
  query: Generic;
}
