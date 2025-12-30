import crypto from 'crypto'
import { sha256, verify } from './hash.node'
import { parseStatement } from './protocol'

export const generateFileHash = (fileContent: Buffer | string): string => {
    return sha256(fileContent)
}

export const validateFileHash = (fileContent: Buffer | string, expectedHash: string): boolean => {
    return verify(fileContent, expectedHash)
}

export const generateStatementContentHash = (statementContent: string): string => {
    return sha256(statementContent)
}

export const validateStatementContentHash = (statementContent: string, expectedHash: string): boolean => {
    return verify(statementContent, expectedHash)
}

export const generateStatementHash = (statement: string): string => {
    const signatureRegex = /^([\s\S]+?)---\n[\s\S]+$/
    const match = statement.match(signatureRegex)
    
    if (match && match[1]) {
        return sha256(match[1])
    }
    
    return sha256(statement)
}

export const validateStatementHash = (statement: string, expectedHash: string): boolean => {
    const computedHash = generateStatementHash(statement)
    return computedHash === expectedHash
}

export const generateStatementsFile = (statements: string[]): string => {
    return statements.join('\n\n')
}

export const parseStatementsFile = (statementsFileContent: string): string[] => {
    const statementParts = statementsFileContent.split(/\n\nStated protocol version: /)
    const statements: string[] = []
    
    for (let i = 0; i < statementParts.length; i++) {
        let statement = statementParts[i]
        
        if (i === 0 && statement.trim().length === 0) continue
        
        if (i > 0) {
            statement = 'Stated protocol version: ' + statement
        }
        
        statement = statement.replace(/\n+$/, '\n')
        
        try {
            parseStatement({ statement })
            statements.push(statement)
        } catch (error) {
            throw new Error(`Invalid statement at index ${i}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
    
    return statements
}

export const generateStatementFilename = (statement: string): string => {
    const hash = generateStatementHash(statement)
    return `${hash}.txt`
}

export const generateAttachmentFilename = (fileContent: Buffer | string, extension: string): string => {
    const hash = generateFileHash(fileContent)
    const ext = extension.startsWith('.') ? extension.substring(1) : extension
    return `${hash}.${ext}`
}