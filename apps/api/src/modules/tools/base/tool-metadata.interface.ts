export type ToolCategory = "NETWORK" | "ANALYSIS" | "ENCODING";
export type ToolInputType = "text" | "url" | "select" | "textarea";

export interface ToolInputField {
  key: string;
  label: string;
  type: ToolInputType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface ToolMetadata {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  isNetwork: boolean;
  isInstant: boolean;       // true = bypass queue, run synchronously
  inputFields: ToolInputField[];
  examples: string[];
  safetyNote?: string;
}
