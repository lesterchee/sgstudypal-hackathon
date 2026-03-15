export type LegalDomain = 'DIVORCE' | 'WILLS' | 'FAIRWORK' | 'PROPERTY';

export interface LogicMetadata {
    [key: string]: boolean | string | string[] | undefined;
}

export interface LegalHandoffPayload {
    domain: LegalDomain;
    metadata: LogicMetadata;
    encryptedPayload: string;
    expiresAt?: Date;
}
