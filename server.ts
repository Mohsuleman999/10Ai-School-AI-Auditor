import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Ask AI endpoint
app.post('/api/gemini/ask', async (req: Request, res: Response) => {
  const { question, reconciliationContext, targetRecordId } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_UNAVAILABLE',
      message: 'Gemini API key is not configured in server environment secrets.',
      fallbackAvailable: true,
    });
  }

  try {
    const systemInstruction = `You are LedgerLens AI Reporting Assistant, an expert enterprise BI and reconciliation analyst for 10AI School by 10Alytics.
You analyze financial ledgers, inventory counts, and HR attendance/payroll records.

MANDATORY RULES:
1. All calculations, joins, and discrepancies have already been computed by the deterministic code engine. Do NOT invent new numbers, totals, or missing records.
2. Every monetary figure MUST be in US Dollars (USD) formatted as $1,234.56. Units and days are counts, never dollar figures.
3. Reference specific source record IDs (e.g. INV-104, SKU-017, EMP-023), row numbers, filenames, and mathematical comparisons.
4. Distinguish clearly between confirmed facts and potential reasons. Suggest cautious next investigation steps rather than alleging fraud or definitive causes.
5. Provide crisp, professional answers structured into:
   - Key Finding & Figures
   - Exact Evidence & Calculation Steps
   - Recommended Next Actions`;

    const userPrompt = `USER QUESTION: "${question}"
TARGET RECORD: ${targetRecordId || 'Global Overview'}

GROUNDED RECONCILIATION DATA CONTEXT:
${JSON.stringify(reconciliationContext, null, 2)}

Provide a thorough, grounded executive response adhering to all rules.`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 15 seconds')), 15000)
    );

    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const text = response.text || 'No response generated from model.';
    return res.json({ answer: text, source: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.error('Gemini API Error:', err.message || err);
    return res.status(500).json({
      error: 'GEMINI_CALL_FAILED',
      message: err.message || 'Error executing Gemini query',
      fallbackAvailable: true,
    });
  }
});

// Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`LedgerLens server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
