import type { SupportedLanguage } from './constants';

export type LegalForm =
  | 'local government'
  | 'state government'
  | 'foreign affairs ministry'
  | 'corporation'
  | 'sole proprietorship';

export type PeopleCountBucket =
  | '0-10'
  | '10-100'
  | '100-1000'
  | '1000-10,000'
  | '10,000-100,000'
  | '100,000+'
  | '1,000,000+'
  | '10,000,000+';

// Type guards
export function isLegalForm(value: string): value is LegalForm {
  return [
    'local government',
    'state government',
    'foreign affairs ministry',
    'corporation',
    'sole proprietorship',
  ].includes(value);
}

export function isPeopleCountBucket(value: string): value is PeopleCountBucket {
  return [
    '0-10',
    '10-100',
    '100-1000',
    '1000-10,000',
    '10,000-100,000',
    '100,000+',
    '1,000,000+',
    '10,000,000+',
  ].includes(value);
}

export function isRatingValue(value: number): value is RatingValue {
  return [1, 2, 3, 4, 5].includes(value);
}

export type StatementTypeValue =
  | 'statement'
  | 'organisation_verification'
  | 'person_verification'
  | 'poll'
  | 'vote'
  | 'response'
  | 'dispute_statement_content'
  | 'dispute_statement_authenticity'
  | 'rating'
  | 'sign_pdf';

export type Statement = {
  domain: string;
  author: string;
  time: Date;
  tags?: string[];
  content: string;
  representative?: string;
  supersededStatement?: string;
  formatVersion?: string;
  translations?: Partial<Record<SupportedLanguage, string>>;
  attachments?: string[];
};

export type CryptographicallySignedStatement = {
  statement: string;
  statementHash: string;
  publicKey: string;
  signature: string;
  algorithm: string;
};

export type Poll = {
  deadline: Date | undefined;
  poll: string;
  scopeDescription?: string;
  options: string[];
  allowArbitraryVote?: boolean;
};

export type OrganisationVerification = {
  name: string;
  englishName?: string;
  country: string;
  city?: string;
  province?: string;
  legalForm: LegalForm;
  department?: string;
  domain: string;
  foreignDomain?: string;
  serialNumber?: string;
  confidence?: number;
  reliabilityPolicy?: string;
  employeeCount?: PeopleCountBucket;
  pictureHash?: string;
  latitude?: number;
  longitude?: number;
  population?: PeopleCountBucket;
  publicKey?: string;
};

export type withOwnDomain = {
  ownDomain: string;
  foreignDomain?: string;
};

export type withForeignDomain = {
  foreignDomain: string;
  ownDomain?: string;
};

export type PersonVerification = {
  name: string;
  countryOfBirth: string;
  cityOfBirth: string;
  dateOfBirth: Date;
  jobTitle?: string;
  employer?: string;
  verificationMethod?: string;
  confidence?: number;
  picture?: string;
  reliabilityPolicy?: string;
  publicKey?: string;
} & (withOwnDomain | withForeignDomain);

export type Vote = {
  pollHash: string;
  poll: string;
  vote: string;
};

export type DisputeAuthenticity = {
  hash: string;
  confidence?: number;
  reliabilityPolicy?: string;
};

export type DisputeContent = {
  hash: string;
  confidence?: number;
  reliabilityPolicy?: string;
};

export type ResponseContent = {
  hash: string;
  response: string;
};

export type PDFSigning = {};

export type RatingSubjectTypeValue =
  | 'Organisation'
  | 'Policy proposal'
  | 'Treaty draft'
  | 'Research publication'
  | 'Regulation'
  | 'Product';

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export type Rating = {
  subjectType?: RatingSubjectTypeValue;
  subjectName: string;
  subjectReference?: string;
  documentFileHash?: string;
  rating: RatingValue;
  quality?: string;
  comment?: string;
};

export type Bounty = {
  motivation?: string;
  bounty: string;
  reward: string;
  judge: string;
  judgePay?: string;
};
