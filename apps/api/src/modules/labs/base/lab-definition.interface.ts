export type LabDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type LabCategory =
  | "XSS" | "CSRF" | "SQL_INJECTION" | "IDOR" | "AUTHENTICATION"
  | "ACCESS_CONTROL" | "JWT" | "SSRF" | "FILE_UPLOAD" | "MISCONFIGURATION" | "OWASP_TOP10";
export type QuestionType = "text" | "code" | "select" | "flag" | "multi";

export interface LabHintMeta {
  key: string;
  order: number;
  title: string;
  content: string;
  xpCost: number;
}

export interface LabStepMeta {
  order: number;
  title: string;
  instruction: string;
  codeExample?: string;
  isOptional?: boolean;
}

export interface LabQuestionMeta {
  key: string;
  label: string;
  type: QuestionType;
  points: number;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  context?: string;     // code snippet / JWT / payload shown to user
}

export interface LabMeta {
  slug: string;
  name: string;
  description: string;
  objective: string;
  category: LabCategory;
  difficulty: LabDifficulty;
  icon: string;
  xpReward: number;
  estimatedMin: number;
  isSandboxed: boolean;
  sandboxImage?: string;
  hints: LabHintMeta[];
  steps: LabStepMeta[];
  questions: LabQuestionMeta[];
  prerequisites?: string[];     // slugs of labs to complete first
  tags?: string[];
}

export interface QuestionFeedback {
  correct: boolean;
  message: string;
  explanation: string;
  expectedValue?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  maxScore: number;
  xpEarned: number;
  hintsUsed?: number;
  feedback: Record<string, QuestionFeedback>;
}
