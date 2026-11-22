import { ObjectId } from "mongodb";

// Turn Mongo's _id into a plain string id so React/JSON can use it
export const toPlain = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
};

export const toPlainList = (docs) => docs.map(toPlain);

// Safely parse an id from the URL; bad ids just return null
export const toId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);
