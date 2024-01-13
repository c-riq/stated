type StatementTypeValue =
  | "statement"
  | "quotation"
  | "organisation_verification"
  | "person_verification"
  | "poll"
  | "vote"
  | "response"
  | "dispute_statement_content"
  | "dispute_statement_authenticity"
  | "boycott"
  | "observation"
  | "rating"
  | "sign_pdf"
  | "bounty";

type Statement = {
  domain: string;
  author: string;
  time: Date;
  tags?: string[];
  content: string;
  representative?: string;
  supersededStatement?: string;
  formatVersion?: string;
};
type Quotation = {
  originalAuthor: string;
  authorVerification: string;
  originalTime?: string;
  source?: string;
  quotation?: string;
  paraphrasedStatement?: string;
  picture?: string;
  confidence?: string;
};
type Poll = {
  country: string | undefined;
  city: string | undefined;
  legalEntity: string | undefined;
  domainScope: string[] | undefined;
  judges?: string;
  deadline: Date;
  poll: string;
  scopeDescription?: string;
  scopeQueryLink?: string;
  options: string[];
  allowArbitraryVote?: boolean;
  requiredProperty?: string;
  requiredPropertyValue?: string;
  requiredPropertyObserver?: string;
  requiredMinConfidence?: number;
};
type OrganisationVerification = {
  name: string;
  englishName?: string;
  country: string;
  city: string;
  province: string;
  legalForm: string;
  department?: string;
  domain: string;
  foreignDomain: string;
  serialNumber: string;
  confidence?: number;
  reliabilityPolicy?: string;
  employeeCount?: string;
  pictureHash?: string;
  latitude?: number;
  longitude?: number;
  population?: string;
};
type PersonVerification = {
  name: string;
  countryOfBirth: string;
  cityOfBirth: string;
  ownDomain?: string;
  foreignDomain?: string;
  dateOfBirth: Date;
  jobTitle?: string;
  employer?: string;
  verificationMethod?: string;
  confidence?: number;
  picture?: string;
  reliabilityPolicy?: string;
};
type Vote = {
  pollHash: string;
  poll: string;
  vote: string;
};
type DisputeAuthenticity = {
  hash: string;
  confidence?: number;
  reliabilityPolicy?: string;
};
type DisputeContent = {
  hash: string;
  confidence?: number;
  reliabilityPolicy?: string;
};
type ResponseContent = {
  hash: string;
  response: string;
};
type PDFSigning = {
  hash: string;
};
type Rating = {
  organisation: string;
  domain: string;
  rating: string;
  comment?: string;
};
type Bounty = {
  motivation?: string;
  bounty: string;
  reward: string;
  judge: string;
  judgePay?: string;
};
type Observation = {
  description?: string;
  approach?: string;
  confidence?: number;
  reliabilityPolicy?: string;
  subject: string;
  subjectReference?: string;
  observationReference?: string;
  property: string;
  value?: string;
};
type PollV3 = {
  country: string | undefined;
  city: string | undefined;
  legalEntity: string | undefined;
  domainScope: string[] | undefined;
  judges?: string;
  deadline: Date;
  poll: string;
  scopeDescription?: string;
  scopeQueryLink?: string;
  scopeProperty?: string;
  propertyScopeObserver?: string;
  pollType?: string;
  options: string[];
};
type Boycott = {
  description?: string;
  reliabilityPolicy?: string;
  subject: string;
  subjectReference?: string;
};
