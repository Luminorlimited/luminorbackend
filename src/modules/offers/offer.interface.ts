
export type IMilestone = {
  title: string;
  description: string;
  price: number;
  revision: number;
  delivery: number; // in days
};

export type IOffer = {
  projectName: string;
  description: string;
  agreementType: AgreementType;
  flatFee?: {
    revision: number;
    delivery: number;
    price: number;
  };
  hourlyFee?: {
    revision: number;
    delivery: number;
    pricePerHour: number;
  };
  orderAgreementPDF: string; // PDF file path or URL
  milestones?: IMilestone[]; // Array of milestone objects
  totalPrice: number;
  totalReceive: number;
  professionalEmail: String; // Refers to the RetireProfessional model
  clientEmail: String; // Refers to the Client model
  createdAt: Date;
  isAccepted: boolean;
  serviceFee: number;
  totalDeliveryTime: number;
  isSeen:boolean;
  count:number
  // transactionNumber:string
};
export enum AgreementType {
  FlatFee = "Flat_Fee",
  HourlyFee = "Hourly_Fee",
  Milestone = "Milestone",
}
