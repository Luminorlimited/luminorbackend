"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENUM_SERVICE_PREFERENCE = exports.INDUSTRIES = exports.getIndustryFromService = void 0;
const industryMapping = {
    engineering_service: "tech",
    technical_services: "tech",
    healthcare_and_medical_consultency: "finance",
    business_consultency_and_management: "finance",
    educational_and_training: "marketing",
    legal_and_financial_services: "finance",
};
// Map expertise to a single industry
const getIndustryFromService = (servicePreference) => {
    return industryMapping[servicePreference] || "Other";
};
exports.getIndustryFromService = getIndustryFromService;
var INDUSTRIES;
(function (INDUSTRIES) {
    INDUSTRIES["TECH"] = "tech";
    INDUSTRIES["MARKETING"] = "marketing";
    INDUSTRIES["FINANCE"] = "finance";
    INDUSTRIES["EDUCATION"] = "education";
    INDUSTRIES["ECOMMERCE"] = "ecommerce";
    INDUSTRIES["REAL_ESTATE"] = "realestate";
    INDUSTRIES["ENTERTAINMENT"] = "entertainment";
    INDUSTRIES["TRAVEL"] = "travel";
    INDUSTRIES["AUTOMOTIVE"] = "automotive";
    INDUSTRIES["MANUFACTURING"] = "manufacturing";
    INDUSTRIES["FOOD"] = "food";
    INDUSTRIES["FASHION"] = "fashion";
})(INDUSTRIES || (exports.INDUSTRIES = INDUSTRIES = {}));
var ENUM_SERVICE_PREFERENCE;
(function (ENUM_SERVICE_PREFERENCE) {
    ENUM_SERVICE_PREFERENCE["BUSINESS_CONSULTENCY_AND_MANAGEMENT"] = "business_consultency_and_management";
    ENUM_SERVICE_PREFERENCE["ENGINEERING_SERVICE"] = "engineering_service";
    ENUM_SERVICE_PREFERENCE["TECHNICAL_SERVICES"] = "technical_services";
    ENUM_SERVICE_PREFERENCE["HEALTHCARE_AND_MEDICAL_CONSULTENCY"] = "healthcare_and_medical_consultency";
    ENUM_SERVICE_PREFERENCE["EDUCATIONAL_AND_TRAINING"] = "educational_and_training";
    ENUM_SERVICE_PREFERENCE["LEGAL_AND_FINANCIAL_SERVICES"] = "legal_and_financial_services";
})(ENUM_SERVICE_PREFERENCE || (exports.ENUM_SERVICE_PREFERENCE = ENUM_SERVICE_PREFERENCE = {}));
