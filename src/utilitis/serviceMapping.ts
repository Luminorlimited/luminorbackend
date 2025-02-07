const industryMapping: { [key: string]: string } = {
  engineering_service: "tech",
  technical_services: "tech",
  healthcare_and_medical_consultency: "finance",
  business_consultency_and_management: "finance",
  educational_and_training: "marketing",
  legal_and_financial_services: "finance",
};

// Map expertise to a single industry
export const getIndustryFromService = (servicePreference: string): string => {
  return industryMapping[servicePreference] || "Other";
};

 
export enum INDUSTRIES {
  TECH = "tech",
  MARKETING = "marketing",
  FINANCE = "finance",
  EDUCATION = "education",
  ECOMMERCE = "ecommerce",
  REAL_ESTATE = "realestate",
  ENTERTAINMENT = "entertainment",
  TRAVEL = "travel",
  AUTOMOTIVE = "automotive",
  MANUFACTURING = "manufacturing",
  FOOD = "food",
  FASHION = "fashion"
}


export enum ENUM_SERVICE_PREFERENCE {
  
  BUSINESS_CONSULTENCY_AND_MANAGEMENT = "business_consultency_and_management",
  ENGINEERING_SERVICE="engineering_service",
  TECHNICAL_SERVICES="technical_services",
  HEALTHCARE_AND_MEDICAL_CONSULTENCY="healthcare_and_medical_consultency",
  EDUCATIONAL_AND_TRAINING="educational_and_training",
  LEGAL_AND_FINANCIAL_SERVICES="legal_and_financial_services"
}