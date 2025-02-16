const industryMapping: { [key: string]: string } = {
  ENGINEERING_SERVICE: "MANUFACTURING",
  TECHNICAL_SERVICES: "ECOMMERCE",
  HEALTHCARE_AND_MEDICAL_CONSULTENCY: "EDUCATION",
  BUSINESS_CONSULTENCY_AND_MANAGEMENT: "REAL_ESTATE",

  LEGAL_AND_FINANCIAL_SERVICES: "ECOMMERCE",
  EDUCATIONAL_AND_TRAINING: "EDUCATION",
};

// Map expertise to a single industry
export const getIndustryFromService = (servicePreference: string): string => {
  console.log(industryMapping[servicePreference] || "Other");
  return industryMapping[servicePreference] || "Other";
};

export enum INDUSTRIES {
  EDUCATION = "education",
  ECOMMERCE = "ecommerce",
  REAL_ESTATE = "realestate",
  ENTERTAINMENT = "entertainment",
  TRAVEL = "travel",
  AUTOMOTIVE = "automotive",
  MANUFACTURING = "manufacturing",
  FOOD = "food",
  FASHION = "fashion",
}

export enum ENUM_SERVICE_PREFERENCE {
  BUSINESS_CONSULTENCY_AND_MANAGEMENT = "business_consultency_and_management",
  ENGINEERING_SERVICE = "engineering_service",
  TECHNICAL_SERVICES = "technical_services",
  HEALTHCARE_AND_MEDICAL_CONSULTENCY = "healthcare_and_medical_consultency",
  EDUCATIONAL_AND_TRAINING = "educational_and_training",
  LEGAL_AND_FINANCIAL_SERVICES = "legal_and_financial_services",
}
