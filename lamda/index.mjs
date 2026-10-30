// Paste into the Lambda code editor as index.mjs (runtime Node.js 20.x), then Deploy.
// Table "Attendance": partition key pk (String), sort key sk (String).
// CORS is configured on the Function URL itself, so this code sends no CORS headers.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE || "Attendance";
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const list = (pk) => db.send(new QueryCommand({
  TableName: TABLE, KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": pk }
}));
const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const validName = (n) => typeof n === "string" && n.trim().length > 0 && n.length <= 60;

export const handler = async (event) => {
  try {
    const method = event.requestContext.http.method;
    const [resource, id] = event.rawPath.split("/").filter(Boolean).map(decodeURIComponent);
    let raw = event.body || "";
    if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
    const body = raw ? JSON.parse(raw) : {};

    const route = `${method} /${resource || ""}${id !== undefined ? "/{id}" : ""}`;
    switch (route) {
      case "GET /students": {
        const { Items } = await list("STUDENT");
        return json(200, Items.map((i) => i.sk));
      }
      case "POST /students": {
        if (!validName(body.name)) return json(400, { error: "Name required (max 60 characters)" });
        await db.send(new PutCommand({ TableName: TABLE, Item: { pk: "STUDENT", sk: body.name.trim() } }));
        return json(201, { ok: true });
      }
      case "DELETE /students/{id}": {
        await db.send(new DeleteCommand({ TableName: TABLE, Key: { pk: "STUDENT", sk: id } }));
        return json(200, { ok: true });
      }
      case "GET /attendance/{id}": {
        if (!validDate(id)) return json(400, { error: "Date must be YYYY-MM-DD" });
        const { Items } = await list("DATE#" + id);
        return json(200, Object.fromEntries(Items.map((i) => [i.sk, i.status])));
      }
      case "PUT /attendance/{id}": {
        if (!validDate(id) || !validName(body.name) || !["present", "absent"].includes(body.status))
          return json(400, { error: "Invalid date, name or status" });
        await db.send(new PutCommand({
          TableName: TABLE, Item: { pk: "DATE#" + id, sk: body.name, status: body.status, at: Date.now() }
        }));
        return json(200, { ok: true });
      }
      default:
        return json(404, { error: "Not found" });
    }
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error" });
  }
};
