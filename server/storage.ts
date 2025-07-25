import { type User, type InsertUser, type StockAnalysis, type InsertStockAnalysis, type ModelResult, type InsertModelResult, type ExportHistory, type InsertExportHistory, users, stockAnalyses, modelResults, exportHistory } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Stock analysis management
  getStockAnalysis(id: string): Promise<StockAnalysis | undefined>;
  getStockAnalysesByUserId(userId: string): Promise<StockAnalysis[]>;
  createStockAnalysis(analysis: InsertStockAnalysis & { userId: string }): Promise<StockAnalysis>;
  updateStockAnalysis(id: string, updates: Partial<StockAnalysis>): Promise<StockAnalysis | undefined>;

  // Model results management
  getModelResult(id: string): Promise<ModelResult | undefined>;
  getModelResultsByAnalysisId(analysisId: string): Promise<ModelResult[]>;
  createModelResult(result: InsertModelResult): Promise<ModelResult>;
  updateModelResult(id: string, updates: Partial<ModelResult>): Promise<ModelResult | undefined>;

  // Export history management
  getExportHistory(userId: string): Promise<ExportHistory[]>;
  createExportHistory(exportRecord: InsertExportHistory): Promise<ExportHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getStockAnalysis(id: string): Promise<StockAnalysis | undefined> {
    const [analysis] = await db.select().from(stockAnalyses).where(eq(stockAnalyses.id, id));
    return analysis || undefined;
  }

  async getStockAnalysesByUserId(userId: string): Promise<StockAnalysis[]> {
    return await db.select().from(stockAnalyses).where(eq(stockAnalyses.userId, userId));
  }

  async createStockAnalysis(analysis: InsertStockAnalysis & { userId: string }): Promise<StockAnalysis> {
    const insertData = {
      userId: analysis.userId,
      ticker: analysis.ticker,
      country: analysis.country,
      startDate: analysis.startDate,
      endDate: analysis.endDate,
      interval: analysis.interval,
      featurePreset: analysis.featurePreset,
      selectedFeatures: analysis.selectedFeatures,
      selectedModels: analysis.selectedModels,
      forecastHorizon: analysis.forecastHorizon,
      trainingWindow: analysis.trainingWindow,
    };
    
    const [stockAnalysis] = await db
      .insert(stockAnalyses)
      .values(insertData)
      .returning();
    return stockAnalysis;
  }

  async updateStockAnalysis(id: string, updates: Partial<StockAnalysis>): Promise<StockAnalysis | undefined> {
    const [updated] = await db
      .update(stockAnalyses)
      .set(updates)
      .where(eq(stockAnalyses.id, id))
      .returning();
    return updated || undefined;
  }

  async getModelResult(id: string): Promise<ModelResult | undefined> {
    const [result] = await db.select().from(modelResults).where(eq(modelResults.id, id));
    return result || undefined;
  }

  async getModelResultsByAnalysisId(analysisId: string): Promise<ModelResult[]> {
    return await db.select().from(modelResults).where(eq(modelResults.analysisId, analysisId));
  }

  async createModelResult(result: InsertModelResult): Promise<ModelResult> {
    const [modelResult] = await db
      .insert(modelResults)
      .values(result)
      .returning();
    return modelResult;
  }

  async updateModelResult(id: string, updates: Partial<ModelResult>): Promise<ModelResult | undefined> {
    const [updated] = await db
      .update(modelResults)
      .set(updates)
      .where(eq(modelResults.id, id))
      .returning();
    return updated || undefined;
  }

  async getExportHistory(userId: string): Promise<ExportHistory[]> {
    return await db.select().from(exportHistory).where(eq(exportHistory.userId, userId));
  }

  async createExportHistory(exportRecord: InsertExportHistory): Promise<ExportHistory> {
    const [exportHistoryRecord] = await db
      .insert(exportHistory)
      .values(exportRecord)
      .returning();
    return exportHistoryRecord;
  }
}

export const storage = new DatabaseStorage();
