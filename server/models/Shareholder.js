import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const filePath = path.join(process.cwd(), "data", "shareholders.json");

function readFile() {
  const dirPath = path.join(process.cwd(), "data");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function writeFile(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const Shareholder = {
  getAll: () => readFile(),
  getById: (id) => readFile().find((s) => s._id === id),
  create: (payload) => {
    const data = readFile();
    const newShareholder = {
      _id: uuidv4(),
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    data.push(newShareholder);
    writeFile(data);
    return newShareholder;
  },
  update: (id, payload) => {
    const data = readFile();
    const index = data.findIndex((s) => s._id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...payload, updatedAt: new Date() };
    writeFile(data);
    return data[index];
  },
  delete: (id) => {
    const data = readFile();
    const index = data.findIndex((s) => s._id === id);
    if (index === -1) return null;
    const removed = data.splice(index, 1);
    writeFile(data);
    return removed[0];
  },
};
