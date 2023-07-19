type FormProps = {
    domain: string,
    author: string,
    serverTime: Date,
    statementToJoin?: any,
    poll?: poll,
    children?: any,
    setStatement: (statement: string) => void,
    setStatementHash: (hash: string) => void,
    setViaAPI: (viaAPI: boolean) => void,
    setAlertMessage: (message: string) => void,
    setisError: (isError: boolean) => void,
    setViaAPI: (viaAPI: boolean) => void,
}
type generateHash = ({viaAPI}:{viaAPI:boolean}) => void