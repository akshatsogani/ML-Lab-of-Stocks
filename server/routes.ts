import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockAnalysisSchema, insertModelResultSchema, insertExportHistorySchema } from "@shared/schema";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Python backend URL - assuming it runs on port 8000
  const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

  // Stock data collection endpoints
  app.post("/api/stock/fetch", async (req, res) => {
    try {
      const { ticker, country, startDate, endDate, interval } = req.body;
      
      // Forward request to Python backend
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/stock/fetch`, {
        ticker,
        country,
        start_date: startDate,
        end_date: endDate,
        interval
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.get("/api/stock/validate/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      
      const response = await axios.get(`${PYTHON_BACKEND_URL}/api/stock/validate/${ticker}`);
      res.json(response.data);
    } catch (error) {
      console.error("Error validating ticker:", error);
      res.status(500).json({ error: "Failed to validate ticker" });
    }
  });

  // Feature engineering endpoints
  app.post("/api/features/generate", async (req, res) => {
    try {
      const { ticker, preset, selectedFeatures, stockData } = req.body;
      
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/features/generate`, {
        ticker,
        preset,
        selected_features: selectedFeatures,
        stock_data: stockData
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error generating features:", error);
      res.status(500).json({ error: "Failed to generate features" });
    }
  });

  app.get("/api/features/presets", async (req, res) => {
    try {
      const response = await axios.get(`${PYTHON_BACKEND_URL}/api/features/presets`);
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching feature presets:", error);
      res.status(500).json({ error: "Failed to fetch feature presets" });
    }
  });

  // Model training endpoints
  app.post("/api/models/train", async (req, res) => {
    try {
      const analysisData = insertStockAnalysisSchema.parse(req.body);
      
      // Create analysis record
      const analysis = await storage.createStockAnalysis({
        ...analysisData,
        userId: "default-user" // For now, using default user
      });

      // Forward training request to Python backend
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/models/train`, {
        analysis_id: analysis.id,
        ...analysisData
      });

      res.json({ analysisId: analysis.id, ...response.data });
    } catch (error) {
      console.error("Error starting model training:", error);
      res.status(500).json({ error: "Failed to start model training" });
    }
  });

  app.get("/api/models/status/:analysisId", async (req, res) => {
    try {
      const { analysisId } = req.params;
      
      const response = await axios.get(`${PYTHON_BACKEND_URL}/api/models/status/${analysisId}`);
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching model status:", error);
      res.status(500).json({ error: "Failed to fetch model status" });
    }
  });

  app.get("/api/models/results/:analysisId", async (req, res) => {
    try {
      const { analysisId } = req.params;
      
      const results = await storage.getModelResultsByAnalysisId(analysisId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching model results:", error);
      res.status(500).json({ error: "Failed to fetch model results" });
    }
  });

  // Forecasting endpoints
  app.post("/api/forecast/generate", async (req, res) => {
    try {
      const { analysisId, modelNames, horizon } = req.body;
      
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/forecast/generate`, {
        analysis_id: analysisId,
        model_names: modelNames,
        horizon
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ error: "Failed to generate forecast" });
    }
  });

  // Backtesting endpoints
  app.post("/api/backtest/run", async (req, res) => {
    try {
      const { analysisId, period, rollingWindow, forecastHorizon, metrics } = req.body;
      
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/backtest/run`, {
        analysis_id: analysisId,
        period,
        rolling_window: rollingWindow,
        forecast_horizon: forecastHorizon,
        metrics
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error running backtest:", error);
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });

  // Export endpoints
  app.post("/api/export/csv", async (req, res) => {
    try {
      const { analysisId, dataType } = req.body;
      
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/export/csv`, {
        analysis_id: analysisId,
        data_type: dataType
      }, { responseType: 'stream' });

      // Create export history record
      await storage.createExportHistory({
        userId: "default-user",
        analysisId,
        exportType: "csv",
        fileName: `${dataType}_${analysisId}.csv`,
        filePath: null,
        shareLink: null
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataType}_${analysisId}.csv"`);
      response.data.pipe(res);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.post("/api/export/json", async (req, res) => {
    try {
      const { analysisId, dataType } = req.body;
      
      const response = await axios.post(`${PYTHON_BACKEND_URL}/api/export/json`, {
        analysis_id: analysisId,
        data_type: dataType
      });

      // Create export history record
      await storage.createExportHistory({
        userId: "default-user",
        analysisId,
        exportType: "json",
        fileName: `${dataType}_${analysisId}.json`,
        filePath: null,
        shareLink: null
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      res.status(500).json({ error: "Failed to export JSON" });
    }
  });

  app.get("/api/export/history", async (req, res) => {
    try {
      const exports = await storage.getExportHistory("default-user");
      res.json(exports);
    } catch (error) {
      console.error("Error fetching export history:", error);
      res.status(500).json({ error: "Failed to fetch export history" });
    }
  });

  // Analysis management endpoints
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getStockAnalysesByUserId("default-user");
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getStockAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  return httpServer;
}
