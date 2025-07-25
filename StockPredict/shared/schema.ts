import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const stockAnalyses = pgTable("stock_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  ticker: text("ticker").notNull(),
  country: text("country").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  interval: text("interval").notNull(),
  featurePreset: text("feature_preset").notNull(),
  selectedFeatures: json("selected_features").$type<string[]>().notNull(),
  selectedModels: json("selected_models").$type<string[]>().notNull(),
  forecastHorizon: integer("forecast_horizon").notNull(),
  trainingWindow: text("training_window").notNull(),
  status: text("status").notNull().default("pending"), // pending, training, completed, failed
  results: json("results").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const modelResults = pgTable("model_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => stockAnalyses.id),
  modelName: text("model_name").notNull(),
  mae: real("mae"),
  rmse: real("rmse"),
  mape: real("mape"),
  sharpeRatio: real("sharpe_ratio"),
  trainingStatus: text("training_status").notNull().default("pending"),
  predictions: json("predictions").$type<any>(),
  confidenceIntervals: json("confidence_intervals").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exportHistory = pgTable("export_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  analysisId: varchar("analysis_id").references(() => stockAnalyses.id),
  exportType: text("export_type").notNull(), // csv, json, pdf, link
  fileName: text("file_name").notNull(),
  filePath: text("file_path"),
  shareLink: text("share_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStockAnalysisSchema = createInsertSchema(stockAnalyses).omit({
  id: true,
  userId: true,
  status: true,
  results: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModelResultSchema = createInsertSchema(modelResults).omit({
  id: true,
  createdAt: true,
});

export const insertExportHistorySchema = createInsertSchema(exportHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StockAnalysis = typeof stockAnalyses.$inferSelect;
export type InsertStockAnalysis = z.infer<typeof insertStockAnalysisSchema>;

export type ModelResult = typeof modelResults.$inferSelect;
export type InsertModelResult = z.infer<typeof insertModelResultSchema>;

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = z.infer<typeof insertExportHistorySchema>;

// Additional types for API responses
export const StockDataResponseSchema = z.object({
  ticker: z.string(),
  data: z.array(z.object({
    date: z.string(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number(),
  })),
  quality: z.object({
    completeness: z.number(),
    missingValues: z.number(),
    outliers: z.number(),
  }),
});

export const FeatureEngineeringResponseSchema = z.object({
  features: z.array(z.object({
    name: z.string(),
    values: z.array(z.number()),
    importance: z.number().optional(),
  })),
  correlationMatrix: z.array(z.array(z.number())),
  selectedFeatures: z.array(z.string()),
});

export const ModelTrainingResponseSchema = z.object({
  modelName: z.string(),
  status: z.enum(["training", "completed", "failed"]),
  progress: z.number(),
  mae: z.number().optional(),
  rmse: z.number().optional(),
  mape: z.number().optional(),
  sharpeRatio: z.number().optional(),
  predictions: z.array(z.object({
    date: z.string(),
    predicted: z.number(),
    actual: z.number().optional(),
    confidence_lower: z.number().optional(),
    confidence_upper: z.number().optional(),
  })).optional(),
});

export const BacktestResultSchema = z.object({
  modelName: z.string(),
  period: z.string(),
  metrics: z.object({
    mae: z.number(),
    rmse: z.number(),
    mape: z.number(),
    sharpeRatio: z.number(),
  }),
  accuracyTrend: z.array(z.object({
    period: z.string(),
    accuracy: z.number(),
  })),
});

export type StockDataResponse = z.infer<typeof StockDataResponseSchema>;
export type FeatureEngineeringResponse = z.infer<typeof FeatureEngineeringResponseSchema>;
export type ModelTrainingResponse = z.infer<typeof ModelTrainingResponseSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
