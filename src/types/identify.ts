export type IdentifyInput = {
  email: string | null;
  phoneNumber: string | null;
};

export type ConsolidatedContact = {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
};

export type IdentifyResponse = {
  contact: ConsolidatedContact;
};
