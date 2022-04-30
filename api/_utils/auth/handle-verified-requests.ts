import { VercelResponse, VercelRequest } from "@vercel/node";
import { setupResponseData } from "../setup-response";
import { send } from "micro";
import { RequestBody, TreeWatered } from "../common/interfaces";
import {
  adoptTree,
  waterTree,
  getTreesWateredByUser,
  isTreeAdoptedByUser,
  getAdoptedTreeIdsByUserId,
  getUserById,
  updateUserLastSeenById,
  exportUserData,
  unadoptTree,
  createUserProfile,
  updateUserProfile,
  getWaterings,
  updateWatered,
  deleteWatering,
} from "../db/db-manager";
import { errorHandler } from "../error-handler";

export async function handleVerifiedRequest(
  tokenSubject: string,
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  let statusCode = 200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  try {
    switch (request.method) {
      case "GET": {
        const { id, queryType, uuid } = request.query;
        if (queryType === undefined) {
          statusCode = 400;
          throw new Error("queryType is not defined");
        }
        if (Array.isArray(queryType)) {
          statusCode = 400;
          throw new Error("queryType needs to be a string");
        }
        statusCode = 200;
        if (Array.isArray(uuid)) {
          statusCode = 400;
          throw new Error("uuid needs to be a string");
        }
        if (Array.isArray(id)) {
          statusCode = 400;
          throw new Error("id needs to be a string");
        }
        switch (queryType) {
          case "wateredbyuser": {
            // private
            if (uuid === undefined) {
              statusCode = 400;
              throw new Error("uuid is undefined");
            }
            result = await getTreesWateredByUser(uuid);
            break;
          }
          case "istreeadopted":
            // private
            if (id === undefined || uuid === undefined) {
              statusCode = 400;
              throw new Error("id or uuid are not defined");
            }
            result = await isTreeAdoptedByUser(uuid, id);
            break;
          case "adopted": {
            // private
            // formerly get-adopted-trees
            if (uuid === undefined) {
              statusCode = 400;
              throw new Error("uuid needs to be defined");
            }
            result = await getAdoptedTreeIdsByUserId(uuid);
            break;
          }
          case "user-profile": {
            if (uuid === undefined) {
              statusCode = 400;
              throw new Error("uuid needs to be defined");
            }
            if (tokenSubject !== uuid) {
              statusCode = 400;
              throw new Error(
                "You're only allowed to query your own user profile",
              );
            }
            result = await getUserById(uuid);
            // update user stats
            await updateUserLastSeenById(uuid);
            break;
          }
          case "canexportusers": {
            if (tokenSubject === "auth0|5f29bb0c53a5990037970148"/*joerg*/ 
                || tokenSubject === "auth0|5f3bc85b4ee503006d6c041b"/*thorsten*/) {
              result = true;
            } else {
              result = false;
            }
            break;
          }
          case "watering": {
            if (id) {
              const waterings = await getWaterings(id);
              result = (waterings.length > 0 && tokenSubject === waterings[0].uuid) && waterings[0]
            }
            break;
          }
          case "user-export": {
            if (tokenSubject !== "auth0|5f29bb0c53a5990037970148"/*joerg*/ 
                && tokenSubject !== "auth0|5f3bc85b4ee503006d6c041b"/*thorsten*/) {
              statusCode = 400;
              throw new Error(
                "You're not allowed to export the user data",
              );
            }
            result = await exportUserData();
            break;
          }
        }
        const data = setupResponseData({
          url: request.url,
          data: result !== undefined ? result : {},
        });
        return send(response, statusCode, data);
      }
      case "POST": {
        let result: any;
        statusCode = 201;

        if (request.body.queryType === undefined) {
          statusCode = 400;
          throw new Error("POST body needs property queryType");
        }
        const {
          queryType,
          tree_id,
          watering_id,
          uuid,
          username,
          amount,
          timestamp,
          patches,
          email,
          ids,
        } = request.body as RequestBody;

        switch (queryType) {
          case "canupdatewaterings": {
            if (!ids) {
              result = {};
              break;
            }
            const promises = []
            if (ids) {
              for (const index in ids) {
                const id = ids[index];
                const wateringsPromise = getWaterings(id);
                promises.push(wateringsPromise)
              }
            }
            result = await Promise.all(promises).then(wateringsList => {
              const map: Record<string, boolean | undefined> = {};
              for (const index in wateringsList) {
                const treeWaterings = wateringsList[index];
                const watering = treeWaterings.length > 0 && treeWaterings[0];
                if (watering) {
                  const allowed = tokenSubject === watering.uuid;
                  map[watering.watering_id] = allowed;
                }
              }
              return map;
            }).catch(e => {
              console.log("error while promise", e);
            })
            break;
          }
          case "adopt":
            if (tree_id === undefined || uuid === undefined) {
              statusCode = 400;
              throw new Error(
                "POST body needs uuid (string) and tree_id (string) properties",
              );
            }
            result = await adoptTree(tree_id, uuid);
            break;

          case "water":
            if (
              tree_id === undefined ||
              uuid === undefined ||
              username === undefined ||
              amount === undefined
            ) {
              statusCode = 400;
              throw new Error(
                "POST body needs uuid (string), tree_id (string), username (string) and amount (number) properties",
              );
            }

            result = await waterTree({ tree_id, username, timestamp, amount, uuid });
            break;

          case "user":
            if (
              uuid === undefined ||
              username === undefined ||
              email === undefined
            ) {
              statusCode = 400;
              throw new Error(
                "POST body needs uuid (string) and email (string) properties",
              );
            }

            if (tokenSubject !== uuid) {
              statusCode = 400;
              throw new Error(
                "You're only allowed to create your own user profile",
              );
            }

            result = await createUserProfile({ uuid, username, email, patches: patches || [] });
            break;

          case "user-profile":
            if (
              uuid === undefined ||
              patches === undefined
            ) {
              statusCode = 400;
              throw new Error(
                "POST body needs uuid (string) and a non empty patches (array) properties",
              );
            }

            if (tokenSubject !== uuid) {
              statusCode = 400;
              throw new Error(
                "You're only allowed to update your own user profile",
              );
            }

            statusCode = 200;
            result = await updateUserProfile({ uuid, patches });
            break;

          case "watering-update": {
            if (!watering_id) {
              statusCode = 400;
              throw new Error(`watering_id missing in request body`);
            }
            const waterings = await getWaterings(watering_id);
            if (waterings.length === 0) {
              statusCode = 404;
              throw new Error(`No watering for ${watering_id}`);
            }
            if (tokenSubject !== waterings[0].uuid) {
              statusCode = 401;
              throw new Error(
                "You're only allowed to update your own waterings",
              );
            }
           if (!patches || patches.length == 0) {
              statusCode = 400;
              throw new Error(
                "POST body needs non empty patches (array) properties",
              );
            }
            statusCode = 200;
            result = await updateWatered({ uuid: watering_id, patches });
            break;
          }

          default:
            statusCode = 400;
            throw new Error("Unknow POST body queryType");
        }
        const data = setupResponseData({
          url: request.url,
          data: result ? result : {},
        });
        return send(response, statusCode, data);
      }
      case "DELETE": {
        if (request.body.queryType === undefined) {
          statusCode = 400;
          throw new Error("DELETE body needs property queryType");
        }
        const { queryType, tree_id, uuid } = request.body as RequestBody;

        switch (queryType) {
          case "unadopt":
            if (tree_id === undefined || uuid === undefined) {
              statusCode = 400;
              throw new Error("DELETE body uuid and tree_id string properties");
            }
            result = await unadoptTree(tree_id, uuid);
            break;
          case "watering-delete":
            if (uuid === undefined) {
              statusCode = 400;
              throw new Error("DELETE body uuid string properties");
            }
            result = await deleteWatering(uuid, tokenSubject);
            break;

          default:
            statusCode = 400;
            throw new Error("Unknow DELETE body queryType");
        }
        const data = setupResponseData({
          url: request.url,
          data: result ? result : {},
        });
        return send(response, statusCode, data);
      }
      default: {
        send(
          response,
          404,
          setupResponseData({
            message: `no response defined for method ${request.method}`,
          }),
        );
      }
    }
  } catch (error) {
    await errorHandler({ response, error, statusCode }).catch((err) => err);
    return;
  }
}
