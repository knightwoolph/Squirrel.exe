import type { Priority } from '../types';

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: Priority;
  category?: string;
  dueDate?: Date;
  tags: string[];
  confidence: number; // 0-1 how confident we are this is a task
  originalText: string; // Keep original for reference
}

export interface AnalysisResult {
  tasks: ExtractedTask[];
  notes: string[]; // Non-actionable items
  summary: string;
  suggestedCategories: string[];
}

// Section headers - these are NOT tasks, they organize tasks
const SECTION_HEADER_PATTERNS = [
  /^(high|medium|low|critical)\s*priority[:\s]/i,
  /^priority\s*(high|medium|low|critical|1|2|3|4|5)[:\s]/i,
  /^(action items|todo|tasks?|deliverables|ongoing|scheduled|upcoming)[:\s-]/i,
  /^(today|tomorrow|this week|next week)[:\s]/i,
  /^[A-Z][A-Z\s]+:$/,  // ALL CAPS headers ending with colon
  /^#+\s/,  // Markdown headers
  /^={3,}|^-{3,}/,  // Separators
];

// Sub-item patterns - these are details, not standalone tasks
const SUB_ITEM_PATTERNS = [
  /endpoints?$/i,
  /^(member|class|billing|payment|check-?in|attendance|reporting|schedule)\s/i,
  /^any other/i,
  /^once confirmed/i,
  /^if needed/i,
];

// Keywords that indicate HIGH priority (Critical/High)
const URGENT_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'critical', 'emergency',
  'today', 'deadline', 'overdue', 'late', 'important', '!!!', '!!',
  'required', 'crucial', 'right away', 'right now',
  'time sensitive', 'eod', 'end of day'
];

// Keywords that indicate MEDIUM priority
const MEDIUM_KEYWORDS = [
  'soon', 'this week', 'next few days',
  'upcoming', 'scheduled', 'before'
];

// Keywords that indicate LOW priority / someday
const LOW_KEYWORDS = [
  'maybe', 'someday', 'eventually', 'when i have time', 'could',
  'might', 'consider', 'think about', 'later', 'backlog', 'nice to have',
  'would be nice', 'low priority', 'not urgent', 'whenever', 'if time permits',
  'one day', 'at some point', 'ongoing'
];

// Action verbs - expanded and categorized
const ACTION_VERBS = new Set([
  // Communication
  'call', 'email', 'text', 'message', 'contact', 'reach', 'follow',
  'respond', 'reply', 'answer', 'ask', 'tell', 'remind', 'notify', 'inform',
  'discuss', 'talk', 'meet', 'schedule', 'invite', 'confirm', 'rsvp',

  // Shopping/Acquiring
  'buy', 'get', 'order', 'purchase', 'pick', 'grab', 'return', 'exchange',
  'renew', 'subscribe', 'cancel',

  // Creating/Building
  'make', 'create', 'build', 'write', 'draft', 'design', 'develop', 'prepare',
  'set', 'setup', 'configure', 'install', 'implement', 'add',

  // Fixing/Maintaining
  'fix', 'repair', 'update', 'upgrade', 'maintain', 'clean', 'organize', 'sort',
  'file', 'declutter', 'tidy', 'arrange',

  // Completing/Finishing
  'finish', 'complete', 'finalize', 'wrap', 'close', 'submit', 'deliver',
  'ship', 'send', 'post', 'publish', 'launch', 'deploy', 'release', 'upload',

  // Starting/Planning
  'start', 'begin', 'initiate', 'plan', 'outline', 'brainstorm', 'research',
  'investigate', 'explore', 'look', 'find', 'figure', 'map',

  // Learning/Reviewing
  'learn', 'study', 'read', 'review', 'check', 'verify', 'test', 'proofread',
  'edit', 'revise', 'practice', 'watch', 'listen', 'document',

  // Administrative
  'pay', 'transfer', 'deposit', 'apply', 'register', 'sign', 'enroll',
  'book', 'reserve', 'reschedule', 'change', 'move', 'block',
  'download', 'upload', 'backup', 'sync', 'export', 'import',

  // Decisions
  'decide', 'choose', 'pick', 'select', 'approve', 'reject', 'evaluate',
  'compare', 'assess', 'determine', 'work'
]);

// Common task starters that indicate intent
const TASK_STARTERS = [
  'need to', 'have to', 'got to', 'gotta', 'must', 'should',
  'want to', 'wanna', 'gonna', 'going to', 'will', 'would like to',
  'planning to', 'plan to', 'trying to', 'remember to', 'don\'t forget to',
  'make sure to', 'be sure to'
];

// Category detection patterns - more specific
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'Work': [
    /\b(work|job|office|boss|coworker|colleague|client|meeting|presentation|report|deadline|project|team|manager|deliverables?)\b/i,
    /\b(slack|zoom|teams|jira|confluence|asana)\b/i
  ],
  'Personal': [
    /\b(personal|home|family|mom|dad|parent|kid|child|spouse|wife|husband|partner|friend|birthday|anniversary|wedding|party)\b/i
  ],
  'Health': [
    /\b(doctor|dentist|gym|exercise|workout|run|jog|yoga|medication|prescription|appointment|checkup|therapy|therapist|health|diet|weight|sleep|fitness|wellness)\b/i,
    /\b(dr\.|physician|specialist|hospital|clinic)\b/i
  ],
  'Finance': [
    /\b(bill|bank|money|budget|tax|invoice|expense|refund|subscription|rent|mortgage|insurance|invest|savings|credit|debt|loan|contract|pricing)\b/i,
    /\b(\$\d+|\d+\s*dollars?)\b/i
  ],
  'Shopping': [
    /\b(buy|order|shop|groceries|amazon|store|purchase|mall|target|walmart|costco|ikea)\b/i,
    /\b(milk|eggs|bread|food|clothes|shoes)\b/i
  ],
  'Learning': [
    /\b(learn|study|course|class|book|read|tutorial|practice|skill|training|certif|degree|school|university)\b/i
  ],
  'Tech': [
    /\b(code|program|app|website|bug|feature|deploy|server|database|api|git|github|integration|endpoint|documentation|mobile|optimization)\b/i,
    /\b(computer|laptop|phone|software|hardware|update|install)\b/i
  ],
  'Errands': [
    /\b(pick up|drop off|return|mail|post office|dry clean|car wash|gas|fill up|dmv|bank|pharmacy)\b/i
  ],
  'Home': [
    /\b(clean|laundry|dishes|vacuum|mop|trash|garbage|recycle|mow|lawn|garden|repair|fix|plumber|electrician)\b/i
  ],
  'Marketing': [
    /\b(marketing|social media|content|post|facebook|instagram|twitter|linkedin|community|branding|seo|ads?|campaign)\b/i
  ]
};

// Date extraction patterns - expanded
const DATE_PATTERNS: Array<{
  pattern: RegExp;
  getDays: (match: RegExpMatchArray) => number;
}> = [
  { pattern: /\btoday\b/i, getDays: () => 0 },
  { pattern: /\btonight\b/i, getDays: () => 0 },
  { pattern: /\btomorrow\b/i, getDays: () => 1 },
  { pattern: /\bday after tomorrow\b/i, getDays: () => 2 },
  { pattern: /\bnext week\b/i, getDays: () => 7 },
  { pattern: /\bthis week\b/i, getDays: () => 3 },
  { pattern: /\bthis weekend\b/i, getDays: () => getNextWeekend() },
  { pattern: /\bnext weekend\b/i, getDays: () => getNextWeekend() + 7 },
  { pattern: /\bend of (?:the )?week\b/i, getDays: () => getNextDayOfWeek(5) },
  { pattern: /\bend of (?:the )?month\b/i, getDays: () => getDaysUntilEndOfMonth() },
  { pattern: /\bmonday\b/i, getDays: () => getNextDayOfWeek(1) },
  { pattern: /\btuesday\b/i, getDays: () => getNextDayOfWeek(2) },
  { pattern: /\bwednesday\b/i, getDays: () => getNextDayOfWeek(3) },
  { pattern: /\bthursday\b/i, getDays: () => getNextDayOfWeek(4) },
  { pattern: /\bfriday\b/i, getDays: () => getNextDayOfWeek(5) },
  { pattern: /\bsaturday\b/i, getDays: () => getNextDayOfWeek(6) },
  { pattern: /\bsunday\b/i, getDays: () => getNextDayOfWeek(0) },
  { pattern: /\bthrough\s+thursday\b/i, getDays: () => getNextDayOfWeek(4) },
  { pattern: /\bthrough\s+friday\b/i, getDays: () => getNextDayOfWeek(5) },
  { pattern: /\bby (?:this )?monday\b/i, getDays: () => getNextDayOfWeek(1) },
  { pattern: /\bby (?:this )?friday\b/i, getDays: () => getNextDayOfWeek(5) },
  { pattern: /\bin (\d+)\s*(?:more\s*)?days?\b/i, getDays: (m) => parseInt(m[1]) },
  { pattern: /\bin (\d+)\s*(?:more\s*)?weeks?\b/i, getDays: (m) => parseInt(m[1]) * 7 },
  { pattern: /\bin (\d+)\s*(?:more\s*)?months?\b/i, getDays: (m) => parseInt(m[1]) * 30 },
  { pattern: /\b(\d+)\s*days?\s*(?:from now|from today)\b/i, getDays: (m) => parseInt(m[1]) },
  {
    pattern: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
    getDays: (m) => getDaysUntilDate(m[1], parseInt(m[2]))
  },
  {
    pattern: /\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\b/i,
    getDays: (m) => getDaysUntilDayOfMonth(parseInt(m[1]))
  }
];

function getNextDayOfWeek(targetDay: number): number {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return daysUntil;
}

function getNextWeekend(): number {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = 6 - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return daysUntil;
}

function getDaysUntilEndOfMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntilDate(monthStr: string, day: number): number {
  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  const month = months[monthStr.toLowerCase()];
  if (month === undefined) return 7;

  const today = new Date();
  let targetDate = new Date(today.getFullYear(), month, day);

  if (targetDate < today) {
    targetDate = new Date(today.getFullYear() + 1, month, day);
  }

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntilDayOfMonth(day: number): number {
  const today = new Date();
  let targetDate = new Date(today.getFullYear(), today.getMonth(), day);

  if (targetDate <= today) {
    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
  }

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function extractDate(text: string): Date | undefined {
  for (const { pattern, getDays } of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const days = getDays(match);
      const date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(23, 59, 59, 999);
      return date;
    }
  }
  return undefined;
}

// Check if this looks like a section header, not a task
function isSectionHeader(text: string): boolean {
  const trimmed = text.trim();

  // Check against known header patterns
  for (const pattern of SECTION_HEADER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Headers often end with colon and are short
  if (trimmed.endsWith(':') && trimmed.split(/\s+/).length <= 6) {
    return true;
  }

  // ALL CAPS short phrases are usually headers
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.split(/\s+/).length <= 5) {
    return true;
  }

  return false;
}

// Check if this is a sub-item/detail rather than a standalone task
function isSubItem(text: string): boolean {
  const trimmed = text.trim().toLowerCase();

  for (const pattern of SUB_ITEM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Very short items that are just nouns (no verbs)
  if (trimmed.split(/\s+/).length <= 2) {
    const words = trimmed.split(/\s+/);
    const hasVerb = words.some(w => ACTION_VERBS.has(w.replace(/[^a-z]/gi, '')));
    if (!hasVerb) {
      return true;
    }
  }

  return false;
}

// Check if this is a person/client name header
function isClientHeader(text: string): boolean {
  const trimmed = text.trim();

  // Pattern: "Name (Description)" or just a name followed by nothing actionable
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*\([^)]+\)\s*$/.test(trimmed)) {
    return true;
  }

  // Short capitalized name without action verb
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(trimmed) && trimmed.split(/\s+/).length <= 3) {
    const lowerText = trimmed.toLowerCase();
    const hasVerb = Array.from(ACTION_VERBS).some(v => lowerText.includes(v));
    if (!hasVerb) {
      return true;
    }
  }

  return false;
}

function detectPriority(text: string, contextPriority?: Priority): Priority {
  const lowerText = text.toLowerCase();

  // Check for explicit priority markers
  if (/\bp1\b|priority\s*1|!!!/.test(lowerText)) return 5;
  if (/\bp2\b|priority\s*2|!!/.test(lowerText)) return 4;
  if (/\bp3\b|priority\s*3/.test(lowerText)) return 3;
  if (/\bp4\b|priority\s*4/.test(lowerText)) return 2;
  if (/\bp5\b|priority\s*5/.test(lowerText)) return 1;

  // Check for urgent indicators (high priority)
  for (const keyword of URGENT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return lowerText.includes('very') || lowerText.includes('extremely') ? 5 : 4;
    }
  }

  // Check for medium indicators
  for (const keyword of MEDIUM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 3;
    }
  }

  // Check for low priority indicators
  for (const keyword of LOW_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 2;
    }
  }

  // Use context priority if available
  if (contextPriority !== undefined) {
    return contextPriority;
  }

  // Default to medium (P3)
  return 3;
}

function detectCategory(text: string): string | undefined {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }
  return undefined;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];

  const hashtagMatches = text.match(/#(\w+)/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(t => t.slice(1).toLowerCase()));
  }

  const mentionMatches = text.match(/@(\w+)/g);
  if (mentionMatches) {
    tags.push(...mentionMatches.map(t => t.slice(1).toLowerCase()));
  }

  return [...new Set(tags)];
}

function extractPerson(text: string): string | undefined {
  const patterns = [
    /\b(?:call|email|text|message|contact|meet(?:\s+with)?|talk\s+to|tell|ask|remind)\s+([A-Z][a-z]+)/,
    /\bwith\s+([A-Z][a-z]+)\b/,
    /@(\w+)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function calculateConfidence(text: string): number {
  const lowerText = text.toLowerCase().trim();
  const cleanedText = lowerText.replace(/^[-•*[\]0-9.)\s]+/, '');
  let confidence = 0.25; // Base confidence

  const words = cleanedText.split(/\s+/);
  const firstWord = words[0] || '';

  // Strong positive indicators

  // Starts with action verb (+0.4)
  if (ACTION_VERBS.has(firstWord)) {
    confidence += 0.4;
  }

  // Has task starter phrase (+0.3)
  for (const starter of TASK_STARTERS) {
    if (cleanedText.startsWith(starter) || cleanedText.includes(' ' + starter + ' ')) {
      confidence += 0.3;
      break;
    }
  }

  // Contains action verb anywhere (+0.2)
  let hasActionVerb = false;
  for (const verb of ACTION_VERBS) {
    if (cleanedText.includes(verb)) {
      hasActionVerb = true;
      confidence += 0.2;
      break;
    }
  }

  // Has a date/time reference (+0.15)
  if (DATE_PATTERNS.some(({ pattern }) => pattern.test(lowerText))) {
    confidence += 0.15;
  }

  // Has bullet/checkbox prefix (+0.1)
  if (/^[-•*]\s|^\[[\sx]?\]|^\d+[.)]\s/.test(text.trim())) {
    confidence += 0.1;
  }

  // Has a person mentioned (+0.1)
  if (/\b(?:call|email|text|meet|tell|ask)\s+[A-Z][a-z]+/.test(text)) {
    confidence += 0.1;
  }

  // Good length (3-15 words) (+0.1)
  const wordCount = words.length;
  if (wordCount >= 3 && wordCount <= 15) {
    confidence += 0.1;
  }

  // Negative indicators

  // Is a section header (-0.5)
  if (isSectionHeader(text)) {
    confidence -= 0.5;
  }

  // Is a client/person header (-0.4)
  if (isClientHeader(text)) {
    confidence -= 0.4;
  }

  // Is a sub-item/detail (-0.3)
  if (isSubItem(text)) {
    confidence -= 0.3;
  }

  // Questions (-0.3)
  if (text.trim().endsWith('?')) {
    confidence -= 0.3;
  }

  // Very short without verb (-0.2)
  if (wordCount < 3 && !hasActionVerb) {
    confidence -= 0.2;
  }

  // Very long (-0.1)
  if (wordCount > 20) {
    confidence -= 0.1;
  }

  // Starts with "note:", "idea:", etc (-0.3)
  if (/^(note|idea|thought|wondering|hmm|what if)s?:?\s/i.test(cleanedText)) {
    confidence -= 0.3;
  }

  // Ends with colon (likely a header) (-0.3)
  if (text.trim().endsWith(':')) {
    confidence -= 0.3;
  }

  return Math.max(0, Math.min(1, confidence));
}

function cleanTaskTitle(text: string): string {
  let cleaned = text.trim();

  // Remove common prefixes
  cleaned = cleaned.replace(/^[-•*]\s*/, '');
  cleaned = cleaned.replace(/^\[[\sx]?\]\s*/, '');
  cleaned = cleaned.replace(/^\d+[.)]\s*/, '');
  cleaned = cleaned.replace(/^(todo|task):\s*/i, '');

  // Remove trailing colon
  cleaned = cleaned.replace(/:$/, '');

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Remove trailing period (but keep ! and ?)
  cleaned = cleaned.replace(/\.+$/, '');

  // Trim whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

interface ParsedItem {
  text: string;
  indent: number;
  contextPriority?: Priority;
  contextClient?: string;
}

// Smart splitting with context awareness
function splitIntoItems(content: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  let currentPriority: Priority | undefined = undefined;
  let currentClient: string | undefined = undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Calculate indent level
    const indent = line.search(/\S/);

    // Check if this is a priority header
    if (/^(high|critical)\s*priority/i.test(trimmed)) {
      currentPriority = 4;
      continue; // Skip the header itself
    } else if (/^medium\s*priority/i.test(trimmed)) {
      currentPriority = 3;
      continue;
    } else if (/^(low|ongoing|scheduled)\s*priority/i.test(trimmed) || /^ongoing:/i.test(trimmed) || /^scheduled:/i.test(trimmed)) {
      currentPriority = 2;
      continue;
    }

    // Check if this is an "Action Items" or similar header
    if (/^action items/i.test(trimmed) || /^(todo|tasks?):/i.test(trimmed)) {
      continue; // Skip meta headers
    }

    // Check if this is a client/project header
    if (isClientHeader(trimmed) || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*\([^)]+\)/.test(trimmed)) {
      // Extract client name
      const match = trimmed.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (match) {
        currentClient = match[1];
      }
      continue; // Skip the client header itself
    }

    items.push({
      text: trimmed,
      indent,
      contextPriority: currentPriority,
      contextClient: currentClient,
    });
  }

  return items;
}

export function analyzeBrainDump(content: string): AnalysisResult {
  const tasks: ExtractedTask[] = [];
  const notes: string[] = [];
  const allCategories: string[] = [];

  const items = splitIntoItems(content);

  for (const item of items) {
    // Skip obvious non-tasks
    if (isSectionHeader(item.text)) {
      notes.push(item.text);
      continue;
    }

    if (isClientHeader(item.text)) {
      notes.push(item.text);
      continue;
    }

    const confidence = calculateConfidence(item.text);

    if (confidence >= 0.35) {
      const priority = detectPriority(item.text, item.contextPriority);
      const category = detectCategory(item.text);
      const dueDate = extractDate(item.text);
      const tags = extractTags(item.text);
      const title = cleanTaskTitle(item.text);
      const person = extractPerson(item.text);

      if (category) allCategories.push(category);

      // Add client as tag if available
      if (item.contextClient && !tags.includes(item.contextClient.toLowerCase())) {
        tags.push(item.contextClient.toLowerCase());
      }

      // Add person as a tag if found
      if (person && !tags.includes(person.toLowerCase())) {
        tags.push(person.toLowerCase());
      }

      tasks.push({
        title,
        priority,
        category,
        dueDate,
        tags,
        confidence,
        originalText: item.text,
      });
    } else {
      notes.push(item.text);
    }
  }

  // Sort: urgent first, then by confidence
  tasks.sort((a, b) => {
    const aUrgent = a.priority >= 4;
    const bUrgent = b.priority >= 4;
    if (aUrgent !== bUrgent) return bUrgent ? 1 : -1;
    return b.confidence - a.confidence;
  });

  const summary = generateSummary(tasks, notes);
  const suggestedCategories = [...new Set(allCategories)];

  return { tasks, notes, summary, suggestedCategories };
}

function generateSummary(tasks: ExtractedTask[], notes: string[]): string {
  if (tasks.length === 0 && notes.length === 0) {
    return 'Nothing to process.';
  }

  const parts: string[] = [];

  if (tasks.length > 0) {
    const urgent = tasks.filter(t => t.priority >= 4).length;
    const withDates = tasks.filter(t => t.dueDate).length;

    parts.push(`Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`);

    if (urgent > 0) {
      parts[0] += ` (${urgent} urgent!)`;
    }

    if (withDates > 0) {
      parts.push(`${withDates} with due dates`);
    }
  }

  if (notes.length > 0) {
    parts.push(`${notes.length} note${notes.length !== 1 ? 's' : ''}`);
  }

  return parts.join(', ') + '.';
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 5: return 'Critical';
    case 4: return 'High';
    case 3: return 'Medium';
    case 2: return 'Low';
    case 1: return 'Someday';
    default: return 'Medium';
  }
}

export function getPriorityEmoji(priority: Priority): string {
  switch (priority) {
    case 5: return '🔴';
    case 4: return '🟠';
    case 3: return '🟡';
    case 2: return '🟢';
    case 1: return '⚪';
    default: return '🟡';
  }
}
