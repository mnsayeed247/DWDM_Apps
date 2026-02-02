// mockdata.ts
import { Warehouse, InventoryItem, ItemStatus, TransferLog } from './types';
import { google } from "googleapis";
import serviceAccount from "./service-account.json"; // your service account JSON

const SPREADSHEET_ID = "1mQtXUOuo_K8Aa1bU4hU7ykq-LE2rN5pH-64aHLf4vzA";

const SHEET_WAREHOUSES = "Warehouses";
const SHEET_ITEMS = "Items";
const SHEET_LOGS = "Logs";

// ----------------- Google Sheets Client -----------------
const auth = new google.auth.JWT(
  serviceAccount.client_email,
  undefined,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);
const sheets = google.sheets({ version: "v4", auth });

// ----------------- WAREHOUSES -----------------
export const fetchWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_WAREHOUSES}!A:D`,
    });
    const rows = res.data.values || [];
    return rows.slice(1).map(r => ({
      id: r[0],
      name: r[1],
      isCentral: r[2]?.toUpperCase() === "TRUE",
      location: r[3],
    }));
  } catch (err) {
    console.error("fetchWarehouses error:", err);
    return [];
  }
};

// ----------------- ITEMS -----------------
export const fetchItems = async (): Promise<InventoryItem[]> => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_ITEMS}!A:G`,
    });
    const rows = res.data.values || [];
    return rows.slice(1).map(r => ({
      serialNumber: r[0],
      partNumber: r[1],
      boardName: r[2],
      category: r[3],
      status: r[4] as ItemStatus,
      warehouseId: r[5],
      lastModified: Number(r[6]),
    }));
  } catch (err) {
    console.error("fetchItems error:", err);
    return [];
  }
};

export const addItem = async (item: InventoryItem) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_ITEMS}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          item.serialNumber,
          item.partNumber,
          item.boardName,
          item.category,
          item.status,
          item.warehouseId,
          item.lastModified
        ]]
      }
    });
  } catch (err) {
    console.error("addItem error:", err);
  }
};

// ----------------- LOGS -----------------
export const fetchLogs = async (): Promise<TransferLog[]> => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_LOGS}!A:K`,
    });
    const rows = res.data.values || [];
    return rows.slice(1).map(r => ({
      id: r[0],
      timestamp: Number(r[1]),
      itemId: r[2],
      serialNumber: r[3],
      boardName: r[4],
      partNumber: r[5],
      fromWarehouseId: r[6],
      toWarehouseId: r[7],
      reason: r[8],
      user: r[9],
      quantity: Number(r[10]),
    }));
  } catch (err) {
    console.error("fetchLogs error:", err);
    return [];
  }
};

export const addLog = async (log: TransferLog) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_LOGS}!A:K`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          log.id,
          log.timestamp,
          log.itemId,
          log.serialNumber,
          log.boardName,
          log.partNumber,
          log.fromWarehouseId,
          log.toWarehouseId,
          log.reason,
          log.user,
          log.quantity
        ]]
      }
    });
  } catch (err) {
    console.error("addLog error:", err);
  }
};
