export interface IFilters {
  query?: string;
  location?: string;
  minBudget?: string;
  maxBudget?: string;
  projectMin?: string;
  projectMax?: string;
  industry?: string | string[];
  skillType?: string | string[];
  timeline?: string | string[];
  [key: string]: any;
}
