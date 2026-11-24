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
import { YoutubeTranscript } from 'youtube-transcript';

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

// Multi-Provider AI Keys Configuration (Google Gemini, Groq, OpenRouter)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_AI_PROVIDER = process.env.AI_PROVIDER || 'auto'; // 'auto' | 'gemini' | 'groq' | 'openrouter'

if (!GOOGLE_API_KEY && !GROQ_API_KEY && !OPENROUTER_API_KEY) {
  console.warn('\x1b[33m[SECURITY WARNING] No AI API keys (GOOGLE_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY) configured in .env.\x1b[0m');
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
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && origin.endsWith('.vercel.app'))) {
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
    if (!urlString || typeof urlString !== 'string') return false;
    let clean = urlString.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
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
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-png', 'image/pjpeg'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Supported images are JPEG, PNG, WebP, GIF, and BMP.'));
  }
};

const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: fileLimits,
  fileFilter: pdfFilter
});

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max for high-res images/diagrams
  fileFilter: imageFilter
});

// Candidate models for automatic failover with active Gemini API models
const CANDIDATE_MODELS = Array.from(new Set([
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest'
]));

// Gemini rate limit cooldown tracker (skip Gemini when 429 quota is hit to failover to Groq instantly)
let geminiCooldownUntil = 0;

// YouTube URL parser & video ID extractor
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  return match ? match[1] : null;
}

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
// MULTI-PROVIDER AI ENGINE (Google Gemini, Groq & OpenRouter)
// -------------------------------------------------------------

// Helper: Transform Gemini parts into OpenAI-compatible message content
function transformPartsToOpenAI(parts) {
  if (typeof parts === 'string') {
    return [{ role: 'user', content: parts }];
  }

  const userContent = [];
  for (const part of parts) {
    if (part.text) {
      userContent.push({ type: 'text', text: part.text });
    } else if (part.inlineData) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
      });
    }
  }

  return [{ role: 'user', content: userContent.length === 1 && userContent[0].type === 'text' ? userContent[0].text : userContent }];
}

// 1. Groq Cloud Engine (Ultra-Fast LPU Inference with Free Tier)
async function callGroq(parts, systemInstruction = '', temperature = 0.2) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push(...transformPartsToOpenAI(parts));

  const hasImage = Array.isArray(parts) && parts.some(p => p.inlineData);
  const models = hasImage 
    ? ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']
    : ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  let lastErr = null;
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 4096
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        if (NODE_ENV !== 'production') console.warn(`[Groq Fallback] Model ${model} returned ${res.status}: ${errText.substring(0, 100)}`);
        lastErr = new Error(`Groq model ${model} failed (${res.status})`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text) return text;
    } catch (err) {
      if (NODE_ENV !== 'production') console.warn(`[Groq Error] ${model}:`, err.message);
      lastErr = err;
    }
  }

  throw lastErr || new Error('All Groq candidate models failed.');
}

// 2. OpenRouter Engine (Access to Free Models: Llama 3.3, DeepSeek R1, Mistral)
async function callOpenRouter(parts, systemInstruction = '', temperature = 0.2) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push(...transformPartsToOpenAI(parts));

  const freeModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'mistralai/mistral-7b-instruct:free'
  ];

  let lastErr = null;
  for (const model of freeModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': CLIENT_URL,
          'X-Title': 'Nexus Intelligence'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 4096
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        if (NODE_ENV !== 'production') console.warn(`[OpenRouter Fallback] Model ${model} returned ${res.status}: ${errText.substring(0, 100)}`);
        lastErr = new Error(`OpenRouter model ${model} failed (${res.status})`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text) return text;
    } catch (err) {
      if (NODE_ENV !== 'production') console.warn(`[OpenRouter Error] ${model}:`, err.message);
      lastErr = err;
    }
  }

  throw lastErr || new Error('All OpenRouter candidate models failed.');
}

// 3. Google Gemini Engine
async function callGeminiDirect(parts, systemInstruction = '', temperature = 0.2) {
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
        
        // If 429 (quota exhausted on this key), all Gemini flash models share this limit.
        // Immediately trigger 60s cooldown and break to failover to Groq instantly!
        if (response.status === 429) {
          geminiCooldownUntil = Date.now() + 60000;
          if (NODE_ENV !== 'production') {
            console.log('[Gemini Quota] Hit 429 rate limit. Instant failover to Groq/alternative engine for 60s.');
          }
          break;
        }
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

// 4. Universal Unified AI Dispatcher with Automatic Provider Failover
async function callAI(parts, systemInstruction = '', temperature = 0.2) {
  // If specific provider requested via environment
  if (DEFAULT_AI_PROVIDER === 'groq' && GROQ_API_KEY) {
    try {
      return await callGroq(parts, systemInstruction, temperature);
    } catch (e) {
      if (NODE_ENV !== 'production') console.warn('[AI Dispatcher] Groq failed, attempting failover...', e.message);
    }
  } else if (DEFAULT_AI_PROVIDER === 'openrouter' && OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(parts, systemInstruction, temperature);
    } catch (e) {
      if (NODE_ENV !== 'production') console.warn('[AI Dispatcher] OpenRouter failed, attempting failover...', e.message);
    }
  }

  // Priority 1: Google Gemini (if key configured and not in rate-limit cooldown)
  if (GOOGLE_API_KEY && Date.now() >= geminiCooldownUntil) {
    try {
      return await callGeminiDirect(parts, systemInstruction, temperature);
    } catch (geminiErr) {
      if (NODE_ENV !== 'production') {
        console.warn('[AI Dispatcher] Gemini models failed, attempting automatic failover to alternative providers...', geminiErr.message);
      }
    }
  }

  // Priority 2: Groq (if key configured)
  if (GROQ_API_KEY) {
    try {
      return await callGroq(parts, systemInstruction, temperature);
    } catch (groqErr) {
      if (NODE_ENV !== 'production') {
        console.warn('[AI Dispatcher] Groq failover failed...', groqErr.message);
      }
    }
  }

  // Priority 3: OpenRouter (if key configured)
  if (OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(parts, systemInstruction, temperature);
    } catch (openRouterErr) {
      if (NODE_ENV !== 'production') {
        console.warn('[AI Dispatcher] OpenRouter failover failed...', openRouterErr.message);
      }
    }
  }

  throw new Error('All configured AI providers (Gemini, Groq, OpenRouter) failed or are missing API keys.');
}

// Alias for backwards compatibility across all existing endpoints
const callGemini = callAI;

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
      link: userSources.filter(s => s.type === 'link').length,
      text: userSources.filter(s => s.type === 'text' || s.type === 'code').length
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

// 4. POST /api/ingest-link - Web link or YouTube ingestion (with SSRF protection & real transcript extraction)
app.post('/api/ingest-link', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL is required.' });
    }

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // SSRF Security Check
    if (!isSafeUrl(cleanUrl)) {
      return res.status(400).json({ error: 'Forbidden URL: Local, loopback, or private addresses cannot be indexed.' });
    }

    const userId = req.user?.id || 'guest';
    let scrapedText = '';
    let linkTitle = sanitizeText(cleanUrl, 120);

    const isYouTube = /(youtube\.com|youtu\.be)/i.test(cleanUrl);
    const ytVideoId = isYouTube ? extractYouTubeId(cleanUrl) : null;

    if (isYouTube && ytVideoId) {
      // 1. Retrieve video metadata via YouTube oEmbed API
      let ytTitle = `YouTube Video (${ytVideoId})`;
      let ytAuthor = '';
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytVideoId}&format=json`, {
          signal: AbortSignal.timeout(6000)
        });
        if (oembedRes.ok) {
          const meta = await oembedRes.json();
          if (meta.title) ytTitle = meta.title;
          if (meta.author_name) ytAuthor = meta.author_name;
        }
      } catch (oembedErr) {
        if (NODE_ENV !== 'production') console.warn('YouTube oEmbed lookup warning:', oembedErr.message);
      }
      linkTitle = ytAuthor ? `${ytTitle} — ${ytAuthor}` : ytTitle;

      // 2. Fetch real captions/transcript from YouTube
      let transcriptText = '';
      try {
        const transcriptEntries = await YoutubeTranscript.fetchTranscript(ytVideoId);
        if (transcriptEntries && transcriptEntries.length > 0) {
          transcriptText = transcriptEntries.map(entry => entry.text).join(' ');
        }
      } catch (ytErr) {
        if (NODE_ENV !== 'production') console.warn('YouTube direct transcript unavailable:', ytErr.message);
      }

      // 3. If transcript was retrieved, index it with metadata; otherwise synthesize with Gemini
      if (transcriptText && transcriptText.length > 50) {
        scrapedText = `[YouTube Video: "${ytTitle}" by ${ytAuthor || 'Creator'}]\n\nFull Video Transcript:\n${transcriptText}`;
      } else {
        const ytPrompt = `The user provided this YouTube video: "${ytTitle}" (${cleanUrl}) by ${ytAuthor || 'Creator'}.
Provide an in-depth, structured educational summary, conceptual breakdown, and technical takeaways covering the core subject matter of this video link for a RAG knowledge base.`;
        scrapedText = await callGemini(ytPrompt, 'You are an expert educational knowledge indexing assistant.', 0.2);
      }
    } else {
      try {
        const fetchRes = await fetch(cleanUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(10000)
        });
        const html = await fetchRes.text();
        
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          linkTitle = sanitizeText(titleMatch[1].trim(), 120);
        }

        let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        clean = clean.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
        clean = clean.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
        clean = clean.replace(/<[^>]+>/g, ' ');
        clean = clean.replace(/\s+/g, ' ').trim();

        if (clean.length > 80) {
          scrapedText = clean;
        } else {
          throw new Error('Web page content too short');
        }
      } catch (fetchErr) {
        if (NODE_ENV !== 'production') console.warn('Direct web fetch failed, falling back to Gemini knowledge synthesis:', fetchErr.message);
        const webPrompt = `The user provided this web page or application documentation link: ${cleanUrl}.
Extract or synthesize a comprehensive, structured technical knowledge reference summarizing the subject matter, architecture, key concepts, and actionable insights associated with this URL for indexing into a RAG knowledge base.`;
        scrapedText = await callGemini(webPrompt, 'You are a web knowledge indexing assistant.', 0.2);
      }
    }

    if (!scrapedText || scrapedText.length < 30) {
      return res.status(400).json({ error: 'Could not extract sufficient text from this link.' });
    }

    const sourceId = `src_link_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newChunks = chunkText(scrapedText, sourceId, userId, linkTitle, 'link', 1000, 200);

    vectorStore.chunks = [...vectorStore.chunks, ...newChunks];
    const sourceObj = {
      id: sourceId,
      userId,
      name: linkTitle,
      url: sanitizeText(cleanUrl, 200),
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

// 5. POST /api/ingest-text - Ingest raw text, markdown, notes, or code from any app
app.post('/api/ingest-text', optionalAuth, async (req, res) => {
  try {
    const { title, text, type = 'text' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Please enter text content to ingest.' });
    }

    const cleanTitle = sanitizeText(title || 'Pasted Note', 100);
    const userId = req.user?.id || 'guest';
    const sourceId = `src_txt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newChunks = chunkText(text.trim(), sourceId, userId, cleanTitle, type, 1000, 200);

    if (newChunks.length === 0) {
      return res.status(400).json({ error: 'Text content is too short to index (minimum 30 characters).' });
    }

    vectorStore.chunks = [...vectorStore.chunks, ...newChunks];
    const sourceObj = {
      id: sourceId,
      userId,
      name: cleanTitle,
      type: type === 'code' ? 'code' : 'text',
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
    if (NODE_ENV !== 'production') console.error('Text Ingestion Error:', err);
    res.status(500).json({ error: `Text Ingestion Error: ${err.message}` });
  }
});

// 5. POST /api/chat - Conversational RAG Query
app.post('/api/chat', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { query, selectedSourceIds } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'A query string is required.' });
    }

    const cleanQuery = sanitizeText(query, 2000);
    if (!cleanQuery) {
      return res.status(400).json({ error: 'Please enter a valid query.' });
    }

    const userId = req.user?.id || 'guest';
    let availableChunks = vectorStore.chunks.filter(c => c.userId === userId);

    // Filter by selected sources if specified by client
    if (Array.isArray(selectedSourceIds) && selectedSourceIds.length > 0) {
      availableChunks = availableChunks.filter(c => selectedSourceIds.includes(c.sourceId));
    }

    if (availableChunks.length === 0) {
      return res.json({
        success: true,
        answer: "No active or selected documents, images, or links were found. Please upload or select at least one source in the Knowledge Sources drawer to begin querying!",
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

// 8. GET /api/sources/:id/chunks - Inspect raw chunks for a specific source
app.get('/api/sources/:id/chunks', optionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const source = vectorStore.sources.find(s => s.id === id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found.' });
  }

  const chunks = vectorStore.chunks
    .filter(c => c.sourceId === id)
    .map(c => ({
      id: c.id,
      text: c.text,
      chunkIndex: c.chunkIndex,
      type: c.type,
      sourceName: c.sourceName
    }));

  res.json({
    success: true,
    source,
    chunks
  });
});

// 9. POST /api/studio/generate - Generate NotebookLM Studio Artifacts (Audio Overview / Podcast, Study Guide, FAQ, Timeline, Briefing Doc)
app.post('/api/studio/generate', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { type = 'podcast', selectedSourceIds, focus } = req.body;
    const userId = req.user?.id || 'guest';

    let availableChunks = vectorStore.chunks.filter(c => c.userId === userId);

    if (Array.isArray(selectedSourceIds) && selectedSourceIds.length > 0) {
      availableChunks = availableChunks.filter(c => selectedSourceIds.includes(c.sourceId));
    }

    if (availableChunks.length === 0) {
      return res.status(400).json({ 
        error: 'No active sources found. Please upload or select at least one source in your Knowledge Sources drawer.' 
      });
    }

    // Limit chunk context window to top 15 chunks (or all if fewer)
    const contextChunks = availableChunks.slice(0, 15);
    const contextFormatted = contextChunks.map((chunk, i) => 
      `[Source Excerpt ${i + 1} | "${chunk.sourceName}"]: \n${chunk.text}`
    ).join('\n\n---\n\n');

    let systemPrompt = '';
    let userPrompt = '';
    let expectsJson = false;

    if (type === 'podcast' || type === 'audio-overview') {
      systemPrompt = `You are the lead showrunner and audio director for Nexus Intelligence Deep Dive, an acclaimed podcast like Google NotebookLM's Audio Overview.
You produce a lively, natural, deeply informative 2-host conversation between:
- **Alex**: The curious, engaging co-host who frames big questions, uses vivid everyday analogies, and keeps the energy dynamic.
- **Jordan**: The sharp, insightful expert who breaks down technical depth, cites evidence from the user's sources, and connects subtle dots.

FORMAT REQUIREMENTS:
1. Every line of dialogue MUST start strictly with either "Alex: " or "Jordan: "
2. Keep the dialogue fast-paced, banter-rich, natural, and conversational. They react to each other ("Totally", "That's wild", "Here's what caught my eye...", "Right, but look at...").
3. Ground the discussion strictly in the provided source material. Mention source names and concepts naturally.
4. Total length: roughly 10 to 16 turns back and forth.
5. Do NOT include markdown stage directions like "(laughs)" or "[intro music]" inside the speaker lines. Keep text clean for text-to-speech rendering.`;

      userPrompt = `Generate a compelling NotebookLM Deep Dive podcast dialogue between Alex and Jordan summarizing and exploring the following source materials:

${contextFormatted}

${focus ? `Special focus requested by user: ${focus}` : 'Cover the core themes, breakthroughs, surprising facts, and practical takeaways.'}`;
    } else if (type === 'slide-deck') {
      expectsJson = true;
      systemPrompt = `You are an elite keynote architect and presentation designer for Google NotebookLM Studio.
Create a polished, cohesive 5 to 7 slide presentation deck based strictly on the provided source materials.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "deckTitle": "Comprehensive title of the presentation",
  "subtitle": "Clear, engaging subtitle",
  "totalSlides": 6,
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "bullets": [
        "First key takeaway or insight",
        "Second supporting point or quantitative evidence",
        "Third actionable conclusion or takeaway"
      ],
      "visualConcept": "Description of an illustrative diagram, flowchart, or visual metaphor for this slide",
      "speakerNotes": "Natural 2-3 sentence talking points for the presenter to deliver aloud"
    }
  ]
}`;

      userPrompt = `Generate a structured slide deck presentation from these sources:

${contextFormatted}`;
    } else if (type === 'video-overview') {
      expectsJson = true;
      systemPrompt = `You are a creative video director and documentary producer for Google NotebookLM Studio.
Create a compelling 2-3 minute video overview storyboard and narration script based strictly on the provided sources.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "videoTitle": "Engaging Video Title",
  "estimatedDuration": "2:30",
  "overview": "Brief summary of the video's thesis",
  "scenes": [
    {
      "sceneNumber": 1,
      "timestamp": "0:00 - 0:25",
      "sceneTitle": "Opening Hook & Core Problem",
      "visualPrompt": "Cinematic visual description: camera movement, graphics, or b-roll animation",
      "onScreenText": "Headline text or stat displayed on screen",
      "narration": "Professional voiceover narration script spoken clearly and compellingly"
    }
  ]
}`;

      userPrompt = `Produce a cinematic video overview storyboard based strictly on these sources:

${contextFormatted}`;
    } else if (type === 'mind-map') {
      expectsJson = true;
      systemPrompt = `You are a visual knowledge architect and cognitive mapping expert for Google NotebookLM Studio.
Construct a clear, hierarchical Mind Map and Mermaid diagram based strictly on the provided sources.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "centralTopic": "Core Subject Name",
  "summary": "1-2 sentence core concept synthesis",
  "branches": [
    {
      "title": "Major Branch 1",
      "summary": "Brief description of this domain",
      "subTopics": [
        "Subtopic detail A",
        "Subtopic detail B",
        "Subtopic detail C"
      ]
    }
  ],
  "mermaid": "graph TD\\n  Root[\\"Core Subject\\"] --> B1[\\"Major Branch 1\\"]\\n  Root --> B2[\\"Major Branch 2\\"]\\n  B1 --> S1[\\"Subtopic detail A\\"]\\n  B1 --> S2[\\"Subtopic detail B\\"]"
}`;

      userPrompt = `Create a structured hierarchical knowledge mind map and Mermaid diagram from these sources:

${contextFormatted}`;
    } else if (type === 'reports') {
      systemPrompt = `You are a senior intelligence analyst and executive research director for Google NotebookLM Studio.
Produce an exhaustive, publication-grade Research Report based strictly on the provided sources.

Structure the report with high visual clarity:
# 📑 Executive Research Report: [Subject]
**Prepared for**: Strategic Decision Makers & Researchers
**Status**: Verified Against Knowledge Sources

## 1. Executive Summary & Core Thesis
(A high-impact synthesis highlighting key conclusions)

## 2. Background, Context & Scope
(Contextual framing and the core problems addressed)

## 3. Comprehensive Findings & Empirical Evidence
(Detailed findings with bullet points, data points, and source citations)

## 4. Critical Analysis & Strategic Implications
(Risks, blind spots, competitive advantages, or technical considerations)

## 5. Strategic Recommendations & Action Plan
(Numbered, concrete, prioritized roadmap of next steps)

## 6. Key Takeaways Summary
(3-4 high-level takeaway bullets)`;

      userPrompt = `Produce an exhaustive Executive Research Report based strictly on these sources:

${contextFormatted}`;
    } else if (type === 'flashcards') {
      expectsJson = true;
      systemPrompt = `You are a master cognitive learning specialist for Google NotebookLM Studio.
Create a high-yield study deck of 8 to 12 flashcards based strictly on the provided sources.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "deckTitle": "Topic Flashcards Deck",
  "totalCards": 8,
  "cards": [
    {
      "id": 1,
      "category": "Core Concept / Architecture / Terminology / Analysis",
      "front": "Clear question, prompt, or challenge",
      "back": "Concise, authoritative explanation and answer grounded in the sources",
      "difficulty": "Easy"
    }
  ]
}`;

      userPrompt = `Generate a high-yield flashcard deck from these sources:

${contextFormatted}`;
    } else if (type === 'quiz') {
      expectsJson = true;
      systemPrompt = `You are an expert assessment and evaluation designer for Google NotebookLM Studio.
Create an engaging, rigorous 5 to 7 question multiple-choice Quiz testing deep comprehension of the provided sources.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "quizTitle": "Comprehensive Knowledge Assessment",
  "totalQuestions": 6,
  "questions": [
    {
      "id": 1,
      "question": "Clear, specific question testing key understanding?",
      "options": [
        "First plausible option",
        "Second correct option",
        "Third plausible option",
        "Fourth plausible option"
      ],
      "correctIndex": 1,
      "explanation": "Detailed rationale explaining why this option is correct based on the provided source excerpts."
    }
  ]
}`;

      userPrompt = `Create an interactive multiple-choice quiz based strictly on these sources:

${contextFormatted}`;
    } else if (type === 'infographic') {
      expectsJson = true;
      systemPrompt = `You are a visual data journalist and information designer for Google NotebookLM Studio.
Distill the provided sources into an impactful, data-rich Infographic breakdown.

OUTPUT INSTRUCTION:
Respond STRICTLY with a valid JSON object matching this schema (no surrounding markdown or backticks):
{
  "title": "Main Infographic Headline",
  "tagline": "A succinct, compelling subtitle summarizing the visual thesis",
  "stats": [
    {
      "value": "95%",
      "label": "Metric Description",
      "trend": "+12% vs prior"
    },
    {
      "value": "3.5x",
      "label": "Speed / Efficiency Gain",
      "trend": "Benchmark top-tier"
    },
    {
      "value": "100%",
      "label": "Source Grounding",
      "trend": "Verified"
    }
  ],
  "pillars": [
    {
      "title": "Pillar 1 Headline",
      "badge": "Core Foundational Pillar",
      "description": "2-3 sentences breaking down this pillar with evidence."
    },
    {
      "title": "Pillar 2 Headline",
      "badge": "Key Mechanism",
      "description": "2-3 sentences breaking down this pillar with evidence."
    },
    {
      "title": "Pillar 3 Headline",
      "badge": "Primary Outcome",
      "description": "2-3 sentences breaking down this pillar with evidence."
    }
  ],
  "takeaways": [
    "High-impact takeaway bullet 1",
    "High-impact takeaway bullet 2",
    "High-impact takeaway bullet 3"
  ]
}`;

      userPrompt = `Extract key stats, pillars, and visual infographic data from these sources:

${contextFormatted}`;
    } else if (type === 'study-guide') {
      systemPrompt = `You are an elite educational researcher producing a master Study Guide in Google NotebookLM style.
Structure your output cleanly with these sections:
# 📚 Master Study Guide
## 1. Executive Summary & Core Objective
(A high-level synthesis of what this material is and why it matters)

## 2. Key Concepts & Deep Breakdown
(Bullet points with bold concepts, clear explanations, and real-world examples)

## 3. Practice Quiz & Knowledge Check
(5 challenging short-answer or multiple-choice questions testing comprehension)

## 4. Answer Key & Rationales
(Detailed answers with explanations for each quiz question)

## 5. Essential Glossary of Terms
(Table or bulleted definitions of critical terminology)`;

      userPrompt = `Create an exhaustive, high-yield Study Guide based strictly on these sources:

${contextFormatted}`;
    } else if (type === 'faq') {
      systemPrompt = `You are a knowledge architecture specialist generating a comprehensive FAQ (Frequently Asked Questions) in Google NotebookLM style.
Identify the 6-8 most critical, nuanced, or commonly misunderstood questions someone reviewing these sources would ask.
Provide crystal-clear, direct, and authoritative answers grounded strictly in the source material.`;

      userPrompt = `Generate a structured, insightful FAQ with answers based on the following sources:

${contextFormatted}`;
    } else if (type === 'timeline') {
      systemPrompt = `You are a chronological analyst for Nexus Intelligence.
Extract all timeline events, dates, historical milestones, project phases, and sequential evolutions from the provided sources into a structured chronological timeline.
Format each milestone clearly with:
- 📅 **[Date / Phase / Milestone]**: Detailed description of what occurred, why it matters, and the source.
- Conclude with a summary of the overall trajectory or next steps.`;

      userPrompt = `Extract and construct a chronological timeline and milestone map from these sources:

${contextFormatted}`;
    } else if (type === 'briefing') {
      systemPrompt = `You are a strategic intelligence director producing a high-stakes Executive Briefing Memo in Google NotebookLM style.
Structure:
# 📑 Executive Briefing Document
- **To**: Stakeholders / Leadership / Research Team
- **Subject**: Strategic Synthesis & Actionable Analysis
- **Executive Summary**: 2-3 high-impact paragraphs
- **Key Findings & Evidence**: Quantifiable data and findings
- **Strategic Implications & Risks**: Blind spots or crucial impact
- **Recommendations & Action Plan**: Concrete next steps`;

      userPrompt = `Produce an Executive Briefing Memo based strictly on these sources:

${contextFormatted}`;
    } else {
      return res.status(400).json({ error: `Unknown studio type: ${type}` });
    }

    const generatedContent = await callGemini(userPrompt, systemPrompt, 0.3);

    // Safely parse JSON if expected or detected
    let parsedData = null;
    if (expectsJson || (generatedContent && (generatedContent.includes('{') || generatedContent.includes('[')))) {
      try {
        let cleanText = generatedContent.trim();
        const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) cleanText = codeBlockMatch[1].trim();

        try {
          parsedData = JSON.parse(cleanText);
        } catch (innerErr) {
          const firstBrace = cleanText.indexOf('{');
          const lastBrace = cleanText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsedData = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
          }
        }
      } catch (parseErr) {
        if (NODE_ENV !== 'production') console.warn('[Studio JSON Parse Fallback]', parseErr.message);
      }
    }

    res.json({
      success: true,
      type,
      content: generatedContent,
      parsedData,
      sourceCount: contextChunks.length,
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (err) {
    if (NODE_ENV !== 'production') console.error('Studio Generation Error:', err);
    res.status(500).json({ error: `Studio Generation Error: ${err.message}` });
  }
});

// Health check (Sanitized status)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Nexus Intelligence (NI) Multimodal Engine',
    timestamp: new Date().toISOString()
  });
});

// GET /api/models/providers - Returns status of configured AI providers
app.get('/api/models/providers', (req, res) => {
  res.json({
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        configured: !!GOOGLE_API_KEY,
        models: ['gemini-3.5-flash', 'gemini-3.6-flash']
      },
      {
        id: 'groq',
        name: 'Groq Cloud (LPU)',
        configured: !!GROQ_API_KEY,
        models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile']
      },
      {
        id: 'openrouter',
        name: 'OpenRouter Free Tier',
        configured: !!OPENROUTER_API_KEY,
        models: ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'mistralai/mistral-7b-instruct:free']
      }
    ],
    defaultProvider: DEFAULT_AI_PROVIDER
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

// Start Server if run directly (local development)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\x1b[32m✔ Nexus Intelligence Server running on http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[36m✔ Security: Helmet, CORS, Rate Limiting, RBAC & SSRF Protections Active\x1b[0m`);
  });
}

export default app;
