import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Security: Load API Key from Environment without exposing hardcoded fallbacks
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn('\x1b[33m[SECURITY WARNING] GOOGLE_API_KEY is not defined in .env. Gemini AI features will return 503 until configured.\x1b[0m');
}

// Security: Enforce JWT Secret from Environment
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (NODE_ENV === 'production') {
    console.error('\x1b[31m[CRITICAL SECURITY ERROR] JWT_SECRET must be set in production! Generating a temporary cryptographically secure key for this session.\x1b[0m');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
  } else {
    console.warn('\x1b[33m[SECURITY WARNING] JWT_SECRET not found in .env. Using ephemeral cryptographic key.\x1b[0m');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
  }
}

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'NexusAdmin2026SecureKey!';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// -------------------------------------------------------------
// HTTP SECURITY HEADERS & SERVER HARDENING
// -------------------------------------------------------------
app.disable('x-powered-by'); // Disable Express fingerprinting
app.use(helmet({
  contentSecurityPolicy: false, // Managed by frontend host/meta
  crossOriginEmbedderPolicy: false
}));

// Strict CORS: Restrict API access to trusted frontend origins only
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with strict size limits to prevent Denial of Service (DoS) memory exhaustion
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// -------------------------------------------------------------
// RATE LIMITING PROTECTION (Brute-force & DoS prevention)
// -------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 auth attempts per IP
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Max 60 AI calls per 15 min per IP to safeguard API quota & prevent abuse
  message: { error: 'AI query rate limit reached. Please wait a few minutes before submitting more queries.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// -------------------------------------------------------------
// DATABASE (Isolated local user store with data privacy)
// -------------------------------------------------------------
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Error reading users file:', err.message);
  }
  return [];
}

function saveUsers(users) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Error saving users file:', err.message);
  }
}

// Sanitize user object to never leak hashed passwords or sensitive internals
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// -------------------------------------------------------------
// INPUT VALIDATION & SANITIZATION HELPERS
// -------------------------------------------------------------
function sanitizeText(input, maxLen = 500) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML brackets to prevent injection
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim()) && email.length <= 100;
}

// Anti-SSRF (Server-Side Request Forgery) protection for web link ingestion
function isSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Disallow loopback, local IPs, private subnet ranges, and cloud metadata endpoints
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' || // AWS/GCP/Azure instance metadata
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// -------------------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
    req.user = decoded;
    next();
  });
}

// Role-Based Access Control (RBAC): Require Admin privileges
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
  }
  next();
}

// Optional Auth (Associates user if authenticated, allows restricted guest fallback)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded;
      }
      next();
    });
  } else {
    const guestId = req.headers['x-guest-session'];
    if (guestId && typeof guestId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(guestId)) {
      req.user = { id: `guest_${guestId}`, role: 'guest', name: 'Guest User' };
    }
    next();
  }
}

// User or Guest Session Auth (Enforces either valid JWT or valid guest session ID)
function authenticateUserOrGuest(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
      }
      req.user = decoded;
      next();
    });
  } else {
    const guestId = req.headers['x-guest-session'];
    if (guestId && typeof guestId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(guestId)) {
      req.user = { id: `guest_${guestId}`, role: 'guest', name: 'Guest User' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
}

// -------------------------------------------------------------
// FILE UPLOADER CONFIGURATION (MULTER)
// -------------------------------------------------------------
const fileLimits = {
  fileSize: 25 * 1024 * 1024 // 25 MB max to protect memory
};

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' && ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Only verified PDF files are permitted.'));
  }
};

const imageFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Only JPEG, PNG, and WebP images are permitted.'));
  }
};

const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: fileLimits,
  fileFilter: pdfFilter
});

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: fileLimits,
  fileFilter: imageFilter
});

// Candidate models for automatic failover
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// In-Memory Multimodal Vector Store
let vectorStore = {
  sources: [],
  chunks: []
};

// -------------------------------------------------------------
// TEXT CHUNKER
// -------------------------------------------------------------
function chunkText(text, sourceId, userId, sourceName, type, chunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  const chunks = [];
  let startIndex = 0;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < normalized.length) {
      const window = normalized.substring(startIndex + chunkSize - 150, startIndex + chunkSize + 150);
      const sentenceEnd = window.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        endIndex = (startIndex + chunkSize - 150) + sentenceEnd + 1;
      }
    } else {
      endIndex = normalized.length;
    }

    const chunkContent = normalized.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 30) {
      chunks.push({
        id: `chunk_${Date.now()}_${chunks.length}`,
        sourceId,
        userId: userId || 'public',
        sourceName: sanitizeText(sourceName, 120),
        type,
        text: chunkContent,
        charCount: chunkContent.length
      });
    }

    startIndex = endIndex - overlap;
    if (startIndex >= normalized.length || endIndex >= normalized.length) break;
  }

  return chunks;
}

// -------------------------------------------------------------
// VECTOR SIMILARITY RETRIEVER
// -------------------------------------------------------------
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function retrieveTopK(query, chunks, k = 4) {
  if (!chunks || chunks.length === 0) return [];
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return chunks.slice(0, k);

  const scored = chunks.map(chunk => {
    const chunkTokens = tokenize(chunk.text);
    const tokenSet = new Set(chunkTokens);

    let matchCount = 0;
    queryTokens.forEach(token => {
      if (tokenSet.has(token)) {
        matchCount += 3;
      } else {
        for (const t of tokenSet) {
          if (t.includes(token) || token.includes(t)) {
            matchCount += 1.5;
            break;
          }
        }
      }
    });

    const score = matchCount / (Math.sqrt(chunkTokens.length) + 1);
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// -------------------------------------------------------------
// CALL GEMINI (Text & Multimodal Vision)
// -------------------------------------------------------------
async function callGemini(parts, systemInstruction = '', temperature = 0.2) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Gemini API Key is not configured on this server.');
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

      const contents = [
        {
          role: 'user',
          parts: Array.isArray(parts) ? parts : [{ text: parts }]
        }
      ];

      const bodyPayload = {
        contents,
        generationConfig: {
          temperature,
          topP: 0.95,
          maxOutputTokens: 4096
        }
      };

      if (systemInstruction) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (NODE_ENV !== 'production') {
          console.warn(`[Gemini Fallback] Model ${model} returned ${response.status}: ${errorText.substring(0, 100)}`);
        }
        lastError = new Error(`Model ${model} failed (${response.status})`);
        continue;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      if (NODE_ENV !== 'production') {
        console.warn(`[Gemini Fallback] Model ${model} error:`, err.message);
      }
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/signup - Register new user with password hashing & validation
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanName = sanitizeText(name, 60);
    const cleanEmail = email.toLowerCase().trim();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    }

    const users = loadUsers();
    if (users.some(u => u.email === cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Role assignment: Default is 'user'. 'admin' role requires valid admin registration code.
    const role = (adminSecret && adminSecret === ADMIN_INVITE_CODE) ? 'admin' : 'user';

    // Password Hashing with 12 salt rounds (industry gold standard for GPU resistance)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Sign up error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/signin - Authenticate user
app.post('/api/auth/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = loadUsers();
    const user = users.find(u => u.email === cleanEmail);

    if (!user) {
      // Timing attack mitigation: still perform a dummy hash check
      await bcrypt.hash('dummy_timing_protection', 12);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Sign in error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me - Validate current session token
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  res.json({ user: sanitizeUser(user) });
});

// -------------------------------------------------------------
// ADMIN PROTECTED ROUTES (RBAC: requireAdmin)
// -------------------------------------------------------------

// GET /api/admin/users - List all users (excluding password hashes)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = loadUsers();
  res.json({
    success: true,
    count: users.length,
    users: users.map(sanitizeUser)
  });
});

// GET /api/admin/stats - System health and database audit
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const users = loadUsers();
  res.json({
    success: true,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeEnv: NODE_ENV,
      memoryUsage: process.memoryUsage(),
      totalUsers: users.length,
      adminCount: users.filter(u => u.role === 'admin').length,
      totalSourcesIndexed: vectorStore.sources.length,
      totalChunksIndexed: vectorStore.chunks.length
    }
  });
});

// DELETE /api/admin/users/:userId - Delete user account and purge their data
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  const { userId } = req.params;
  let users = loadUsers();

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Prevent admin from deleting themselves accidentally
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
  }

  users.splice(userIndex, 1);
  saveUsers(users);

  // Purge user's vector store sources and chunks
  vectorStore.sources = vectorStore.sources.filter(s => s.userId !== userId);
  vectorStore.chunks = vectorStore.chunks.filter(c => c.userId !== userId);

  res.json({ success: true, message: `User ${userId} and associated data successfully removed.` });
});

// POST /api/admin/clear-all - Global reset of all sources (Admin only)
app.post('/api/admin/clear-all', authenticateToken, requireAdmin, (req, res) => {
  vectorStore = { sources: [], chunks: [] };
  res.json({ success: true, message: 'Global vector store successfully purged.' });
});

// -------------------------------------------------------------
// MULTIMODAL KNOWLEDGE BASE ENDPOINTS (Scoped per user)
// -------------------------------------------------------------

// 1. GET /api/sources - List all indexed sources for the current user
app.get('/api/sources', optionalAuth, (req, res) => {
  const userId = req.user?.id;
  const userSources = userId 
    ? vectorStore.sources.filter(s => s.userId === userId)
    : [];

  const userChunks = userId 
    ? vectorStore.chunks.filter(c => c.userId === userId)
    : [];

  res.json({
    sources: userSources,
    totalChunks: userChunks.length,
    activeCounts: {
      pdf: userSources.filter(s => s.type === 'pdf').length,
      image: userSources.filter(s => s.type === 'image').length,
      link: userSources.filter(s => s.type === 'link').length
    }
  });
});

// 2. POST /api/ingest-pdf - Upload & parse PDF (Strict validation)
app.post('/api/ingest-pdf', optionalAuth, aiLimiter, uploadPDF.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file attached.' });
    }

    const userId = req.user?.id || 'guest';
    const cleanFileName = sanitizeText(req.file.originalname, 100);

    const parsed = await pdfParse(req.file.buffer);
    const text = parsed.text || '';
    const numPages = parsed.numpages || 1;

    if (!text.trim()) {
      return res.status(400).json({ error: 'No extractable text found in this PDF (might be a scanned image).' });
    }

    const sourceId = `src_pdf_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newChunks = chunkText(text, sourceId, userId, cleanFileName, 'pdf', 1000, 200);

    vectorStore.chunks = [...vectorStore.chunks, ...newChunks];
    const sourceObj = {
      id: sourceId,
      userId,
      name: cleanFileName,
      type: 'pdf',
      pages: numPages,
      chunkCount: newChunks.length,
      preview: sanitizeText(text.substring(0, 200)) + '...',
      timestamp: new Date().toLocaleTimeString()
    };
    vectorStore.sources.push(sourceObj);

    res.json({
      success: true,
      source: sourceObj,
      totalChunks: vectorStore.chunks.filter(c => c.userId === userId).length
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('PDF Ingestion Error:', err);
    res.status(500).json({ error: `PDF Processing Error: ${err.message}` });
  }
});

// 3. POST /api/ingest-image - Upload image & extract visual knowledge via Gemini Vision
app.post('/api/ingest-image', optionalAuth, aiLimiter, uploadImage.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const userId = req.user?.id || 'guest';
    const cleanFileName = sanitizeText(req.file.originalname, 100);
    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');

    const visionParts = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      {
        text: `Analyze this image thoroughly to build a high-fidelity Knowledge Base for Nexus Intelligence (NI).
Provide a comprehensive breakdown:
1. Complete visible text transcript / OCR (verbatim).
2. Structural descriptions (diagrams, flowcharts, architectures, tables, numbers, entities).
3. Core technical insights, concepts, relationships, and takeaways depicted.
Be thorough, precise, and highly detailed.`
      }
    ];

    const visionAnalysis = await callGemini(visionParts, 'You are an advanced Multimodal Vision & OCR AI for document intelligence.', 0.2);

    const sourceId = `src_img_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newChunks = chunkText(visionAnalysis, sourceId, userId, cleanFileName, 'image', 1000, 200);

    vectorStore.chunks = [...vectorStore.chunks, ...newChunks];
    const sourceObj = {
      id: sourceId,
      userId,
      name: cleanFileName,
      type: 'image',
      chunkCount: newChunks.length,
      preview: sanitizeText(visionAnalysis.substring(0, 200)) + '...',
      timestamp: new Date().toLocaleTimeString()
    };
    vectorStore.sources.push(sourceObj);

    res.json({
      success: true,
      source: sourceObj,
      analysis: visionAnalysis,
      totalChunks: vectorStore.chunks.filter(c => c.userId === userId).length
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Image Ingestion Error:', err);
    res.status(500).json({ error: `Image Analysis Error: ${err.message}` });
  }
});

// 4. POST /api/ingest-link - Web link or YouTube ingestion (with SSRF protection)
app.post('/api/ingest-link', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL is required.' });
    }

    // SSRF Security Check
    if (!isSafeUrl(url)) {
      return res.status(400).json({ error: 'Forbidden URL: Local, loopback, or private addresses cannot be indexed.' });
    }

    const userId = req.user?.id || 'guest';
    let scrapedText = '';
    let linkTitle = sanitizeText(url, 120);

    const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);

    if (isYouTube) {
      linkTitle = `YouTube: ${sanitizeText(url, 80)}`;
      const ytPrompt = `The user provided this YouTube video link: ${url}. Provide an in-depth, structured transcript and technical educational summary of the subject matter covered by this video link so it can be indexed into a RAG knowledge base.`;
      scrapedText = await callGemini(ytPrompt, 'You are an expert audio-visual transcriber.', 0.2);
    } else {
      try {
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        const html = await fetchRes.text();
        
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          linkTitle = sanitizeText(titleMatch[1].trim(), 120);
        }

        let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        clean = clean.replace(/<[^>]+>/g, ' ');
        clean = clean.replace(/\s+/g, ' ').trim();

        scrapedText = clean;
      } catch (fetchErr) {
        const webPrompt = `Synthesize full technical reference content and factual data for the website URL: ${url} for indexing into a RAG knowledge base.`;
        scrapedText = await callGemini(webPrompt, 'You are a web knowledge indexing assistant.', 0.2);
      }
    }

    if (!scrapedText || scrapedText.length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from this link.' });
    }

    const sourceId = `src_link_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newChunks = chunkText(scrapedText, sourceId, userId, linkTitle, 'link', 1000, 200);

    vectorStore.chunks = [...vectorStore.chunks, ...newChunks];
    const sourceObj = {
      id: sourceId,
      userId,
      name: linkTitle,
      url: sanitizeText(url, 200),
      type: 'link',
      chunkCount: newChunks.length,
      preview: sanitizeText(scrapedText.substring(0, 200)) + '...',
      timestamp: new Date().toLocaleTimeString()
    };
    vectorStore.sources.push(sourceObj);

    res.json({
      success: true,
      source: sourceObj,
      totalChunks: vectorStore.chunks.filter(c => c.userId === userId).length
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Link Ingestion Error:', err);
    res.status(500).json({ error: `Link Ingestion Error: ${err.message}` });
  }
});

// 5. POST /api/chat - Conversational RAG Query
app.post('/api/chat', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'A query string is required.' });
    }

    const cleanQuery = sanitizeText(query, 2000);
    if (!cleanQuery) {
      return res.status(400).json({ error: 'Please enter a valid query.' });
    }

    const userId = req.user?.id;
    const availableChunks = userId
      ? vectorStore.chunks.filter(c => c.userId === userId)
      : [];

    if (availableChunks.length === 0) {
      return res.json({
        success: true,
        answer: "No documents, images, or links have been added to your Knowledge Hub yet. Please upload a PDF, image, or link above to begin querying!",
        citedPassages: []
      });
    }

    const topChunks = retrieveTopK(cleanQuery, availableChunks, 4);

    const contextFormatted = topChunks.map((chunk, i) => 
      `[Passage ${i + 1} | Source: "${chunk.sourceName}" (Type: ${chunk.type.toUpperCase()})]:\n${chunk.text}`
    ).join('\n\n---\n\n');

    const SYSTEM_PROMPT = `
You are NI (Nexus Intelligence), an advanced multimodal intelligence system.
Your mission is to provide HIGH-IMPACT, CRYSTAL-CLEAR, ENGAGING, and EASILY READABLE answers grounded strictly in the user's uploaded sources.

STYLE & STRUCTURE GUIDELINES:
1. ELIMINATE BORING INTROS & FLUFF:
   - NEVER start with generic phrases like "Based on the provided documents...", "According to the text...", or "In the uploaded file...".
   - Deliver the direct, punchy answer immediately in the first sentence.

2. SCANNABLE, READABLE LAYOUT:
   - 🎯 **Direct Answer**: 1-2 clear, bold sentences that directly resolve the user's question.
   - 📌 **Key Highlights**: Use bullet points with **bold topic leads** so the user can easily read and digest the information.
   - 💡 **Core Insight**: A concise concluding takeaway or practical implication.
   - Use clean tables or numbered steps when detailing processes, architecture flows, or comparisons.

3. SIMPLE, EFFECTIVE LANGUAGE:
   - Keep paragraphs short (2-3 sentences max). No intimidating walls of text.
   - Explain technical concepts with crystal clarity while maintaining accuracy.

4. GROUNDING & CITATIONS:
   - Ground everything in the retrieved passages. Tag sources neatly (e.g., [Source: file.pdf] or [Image: diagram.png]).
   - If the information is genuinely not present in the sources, state directly:
     "I cannot find this information in your uploaded documents, images, or links."
`;

    const userPrompt = `
=== RETRIEVED CONTEXT PASSAGES ===
${contextFormatted}

=== USER QUESTION ===
${cleanQuery}

Provide a grounded, cited response based strictly on the context passages above.
`;

    const answer = await callGemini(userPrompt, SYSTEM_PROMPT, 0.2);

    res.json({
      success: true,
      query: cleanQuery,
      answer,
      citedPassages: topChunks.map(c => ({
        sourceName: c.sourceName,
        type: c.type,
        text: c.text,
        score: c.score ? c.score.toFixed(2) : '1.00'
      }))
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Chat Error:', err);
    res.status(500).json({ error: `RAG Query Error: ${err.message}` });
  }
});

// 6. DELETE /api/sources/:id - Remove a specific source (Strict ownership authorization check)
app.delete('/api/sources/:id', authenticateUserOrGuest, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const source = vectorStore.sources.find(s => s.id === id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found.' });
  }

  // Authorization Check: User must own the source or be an administrator
  if (source.userId !== userId && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: You cannot delete another user\'s source.' });
  }

  vectorStore.sources = vectorStore.sources.filter(s => s.id !== id);
  vectorStore.chunks = vectorStore.chunks.filter(c => c.sourceId !== id);

  res.json({
    success: true,
    message: 'Source removed successfully',
    remainingSources: vectorStore.sources.filter(s => s.userId === userId).length,
    remainingChunks: vectorStore.chunks.filter(c => c.userId === userId).length
  });
});

// 7. POST /api/clear - Clear the active user's knowledge base only
app.post('/api/clear', authenticateUserOrGuest, (req, res) => {
  const userId = req.user.id;
  vectorStore.sources = vectorStore.sources.filter(s => s.userId !== userId);
  vectorStore.chunks = vectorStore.chunks.filter(c => c.userId !== userId);

  res.json({ success: true, message: 'Your knowledge base was cleared successfully.' });
});

// Health check (Sanitized status)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Nexus Intelligence (NI) Multimodal Engine',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// CENTRALIZED ERROR HANDLER
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  
  // Prevent stack trace / internal error leakage to clients in production
  if (NODE_ENV !== 'production') {
    console.error('[Internal Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }

  res.status(500).json({ error: 'An unexpected internal error occurred. Please try again later.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\x1b[32m✔ Nexus Intelligence Server running on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[36m✔ Security: Helmet, CORS, Rate Limiting, RBAC & SSRF Protections Active\x1b[0m`);
});
