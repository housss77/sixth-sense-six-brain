# SIXth Sense

SIXth Sense is a compliance and master data co-pilot prototype. It combines official regulatory documents with expert workflow transcripts, retrieves the most relevant context, sends that context to Claude, and displays a structured answer in a React dashboard.

## What Was Built

The app has four main parts:

1. **Phase 1: Document ingestion and retrieval**
   - Loads PDF and DOCX files from `SIX_Git_Sources/`.
   - Adds metadata so official PDFs and expert DOCX transcripts can be searched separately.
   - Splits documents into chunks.
   - Embeds chunks locally using HuggingFace `all-MiniLM-L6-v2`.
   - Stores vectors in local ChromaDB at `./chroma_db`.

2. **Phase 2: Agent layer**
   - Retrieves official-rule context and expert-workflow context.
   - Sends both context blocks plus the user query to Claude.
   - Returns a strict JSON response with:
     - `message`
     - `requires_bpo_action`
     - `bpo_draft_form`

3. **Phase 3: Frontend dashboard**
   - React + Vite + Tailwind CSS v4.
   - Split-screen enterprise UI:
     - Left side: SIXth Sense chat copilot.
     - Right side: Master Data STP Gateway.
   - Calls the backend endpoint at `http://127.0.0.1:5000/api/query`.

4. **Phase 4: BPO handoff simulation**
   - Adds a mock endpoint for BPO/STP submission.
   - Frontend dispatch button sends the draft form to the backend.
   - Backend prints a simulated SFTP transfer log.

## Important Files

```text
data_ingestion.py       Builds the Chroma vector database from PDFs and DOCX files
retrieval_engine.py     Searches ChromaDB with metadata filters
agent.py                Calls Claude and returns structured JSON
server.py               FastAPI backend for the frontend
test_phase1.py          Tests retrieval only
test_phase2.py          Tests retrieval plus Claude response
requirements.txt        Python dependencies
client/                 React frontend
client/src/App.jsx      Main dashboard UI
```

Ignored local files:

```text
.env                    Local API keys
chroma_db/              Local vector database
client/node_modules/    Frontend dependencies
client/dist/            Frontend build output
SIX_Git_Sources/        Local document source folder, not committed
```

## Prerequisites

Install:

- Python 3.11+
- Node.js and npm
- A Claude API key from Anthropic

The source document folder must exist locally:

```text
SIX_Git_Sources/
```

It should contain the PDF and DOCX files used for ingestion.

## Backend Setup

From the project root:

```powershell
cd D:\Users\Houssam\Start_Hack_2026
python -m pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Do not commit `.env`.

## Build the Vector Database

Run this whenever `SIX_Git_Sources/` changes or when `chroma_db/` is missing:

```powershell
python data_ingestion.py
```

Expected result:

```text
ChromaDB vector store saved successfully to ./chroma_db.
```

This step may take a while because it reads and embeds the documents.

## Test Phase 1: Retrieval Only

Run:

```powershell
python test_phase1.py
```

This should print:

- top official-rule results from PDFs
- top expert-workflow results from DOCX transcripts

This verifies ChromaDB, embeddings, and metadata filtering.

## Test Phase 2: Claude Agent

Run:

```powershell
python test_phase2.py
```

This verifies:

- retrieval from ChromaDB
- Claude API call
- strict JSON parsing
- `requires_bpo_action`
- `bpo_draft_form`

Example query:

```text
How do we handle ESG-linked structured products?
```

Expected behavior:

- The response should ask for an ISIN if none was provided.
- The response should mention coverage/classification cannot be confirmed without an ISIN.
- The JSON should include the three required keys.

## Run the Backend Server

From the project root:

```powershell
python server.py
```

Expected output:

```text
Starting SIXth Sense Backend on http://127.0.0.1:5000
```

Backend endpoints:

```text
GET  http://127.0.0.1:5000/
POST http://127.0.0.1:5000/api/query
POST http://127.0.0.1:5000/api/bpo-submit
```

Keep this terminal running.

## Frontend Setup

Open a second terminal:

```powershell
cd D:\Users\Houssam\Start_Hack_2026\client
npm install
```

Run the frontend:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/
```

## Test the Full App

1. Start the backend:

   ```powershell
   python server.py
   ```

2. Start the frontend:

   ```powershell
   cd client
   npm run dev
   ```

3. Open:

   ```text
   http://localhost:5173/
   ```

4. Ask:

   ```text
   How do we handle ESG-linked structured products?
   ```

5. Expected frontend behavior:

   - User message appears on the right.
   - Assistant response appears on the left.
   - STP Gateway updates based on `requires_bpo_action`.
   - If action is required, the dispatch button becomes active.

6. Click:

   ```text
   Dispatch Automated Opening Request
   ```

7. Expected backend console log:

   ```text
   [MOCK SFTP] Transferring data to Master Data System: {...}
   ```

8. Expected frontend behavior:

   - Browser alert confirms the simulated transmission.
   - STP status resets to no action needed.

## Common Issues

### `ModuleNotFoundError: No module named 'fastapi'`

Run:

```powershell
python -m pip install -r requirements.txt
```

### Claude model not found

Check `.env`:

```env
ANTHROPIC_MODEL=claude-sonnet-4-6
```

If your Anthropic account does not have this model, list available models with:

```powershell
python -c "import os; from dotenv import load_dotenv; from anthropic import Anthropic; load_dotenv(); client=Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY')); models=client.models.list(limit=20); [print(m.id) for m in models.data]"
```

Then update `ANTHROPIC_MODEL`.

### ChromaDB disk I/O error on Windows

If ChromaDB fails with a SQLite disk I/O error, delete and rebuild the local database:

```powershell
Remove-Item -Recurse -Force .\chroma_db
python data_ingestion.py
```

### `npx tailwindcss init -p` fails

This project uses Tailwind CSS v4 with the Vite plugin. That command is not needed.

Use:

```powershell
npm run dev
```

or:

```powershell
npm run build
```

## Development Notes

- The React frontend calls the FastAPI backend directly at `http://127.0.0.1:5000`.
- The backend loads Claude credentials from `.env`.
- The vector database is local and must be built before retrieval works.
- The BPO handoff is a simulation only. It prints a mock SFTP transfer log and returns a success message.

