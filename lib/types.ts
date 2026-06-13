export interface DeadlineEntity {
  text: string;
  date: string | null;
  context: string;
}

export interface BudgetEntity {
  text: string;
  amount: string | null;
  context: string;
}

export interface EvaluationWeight {
  criterion: string;
  weight: string;
  context: string;
}

export interface ComplianceClause {
  clause: string;
  type: string;
  context: string;
}

export interface NERResult {
  deadlines: DeadlineEntity[];
  budgets: BudgetEntity[];
  evaluationWeights: EvaluationWeight[];
  complianceClauses: ComplianceClause[];
}

export interface ExtractedRequirement {
  id: string;
  text: string;
  category: string;
  priority: "high" | "medium" | "low";
  sectionType: "question" | "narrative" | "compliance";
  sectionTitle?: string;
}

export interface EvaluationCriterion {
  criterion: string;
  weight: string;
  description?: string;
  sourceQuote?: string;
  taxonomyMatch?: string;
}

export interface RequirementScore {
  requirement: string;
  similarity: number;
  answerable: boolean;
  topSource: string | null;
}

export interface ComplianceChecklistItem {
  id: string;
  requirement: string;
  mandatory: boolean;
  sectionType: string;
  category: string;
  status: "pass" | "fail" | "partial";
  similarity: number;
  evidence: string | null;
  notes: string;
}

export interface WinScoreBreakdown {
  capabilityMatch: number;
  complianceCoverage: number;
  requirementAnswerability: number;
  confidenceScore: number;
  budgetAlignment: number;
  historicalWinRate: number;
  competitorRisk: number;
}

export interface WinScoreResult {
  overall: number;
  label: string;
  breakdown: WinScoreBreakdown;
  gaps: string[];
  requirementScores: RequirementScore[];
}

export type GoNoGoDecision = "GO" | "NO-GO" | "REVIEW";

export interface GoNoGoResult {
  decision: GoNoGoDecision;
  rationale: string;
  factors: {
    overallScore: number;
    mandatoryPassRate: number;
    complianceCoverage: number;
    budgetAlignment: number;
    historicalWinRate: number;
  };
}

export interface RFPAnalysisResult {
  workspaceId?: string;
  filename?: string;
  domain?: string;
  summary: string;
  entities: NERResult;
  requirements: ExtractedRequirement[];
  evaluationCriteria: EvaluationCriterion[];
  complianceChecklist: ComplianceChecklistItem[];
  winScore: WinScoreResult;
  goNoGo: GoNoGoResult;
}

export interface Workspace {
  id: string;
  name: string;
  source_filename: string | null;
  domain: string | null;
  status: string;
  summary: string | null;
  entities: NERResult | null;
  requirements: ExtractedRequirement[] | null;
  evaluation_criteria: EvaluationCriterion[] | null;
  win_score: WinScoreResult | null;
  compliance_checklist: ComplianceChecklistItem[] | null;
  go_no_go: GoNoGoDecision | null;
  go_no_go_rationale: string | null;
  effort_baseline_minutes: number | null;
  effort_ai_minutes: number | null;
  effort_reduction_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceResponse {
  id: string;
  workspace_id: string;
  requirement_id: string | null;
  section_type: string | null;
  section_title: string | null;
  question: string;
  answer: string | null;
  confidence: string | null;
  win_probability: number | null;
  approved: boolean;
  sources: unknown;
}

export interface ProposalSection {
  title: string;
  sectionType: string;
  items: {
    question: string;
    answer: string;
    source?: string;
    confidence?: string;
    status?: string;
  }[];
}
