
export const generateEmail = ({content, author}:{content:string, author:string}) => {
    const email = `stated@${window.location.host.replace('stated.','')}`
    const urlEncodedSubject = encodeURIComponent('Publish a statement')
    const publishingRequest = 'Please publish the following statement on our behalf:'
    const verificationRequest = 'Please also publish a statement, verifying our identity.\n' +
    'Below we may provide evidence to authenticate this request, which: '+
    '\n\t (1) show that the domain name of this email account belongs to the author of the statement such as'+
    '\n\t\t - an official document containing identity information about my organisation'+
    '\n\t\t - a document or reference linking the domain and my organisations identiy'+
    '\n\t (2) show that I am authorized to represent my organisation.'
    const redactedStatement = `Author: ${author}\nStatement content: ${content}`
    const text = `${publishingRequest}\n\n\n${redactedStatement}\n\n\n${verificationRequest}`
    const urlEncodedbody = encodeURIComponent(text)
    const href = `mailto:${email}?subject=${urlEncodedSubject}&body=${urlEncodedbody}`
    console.log(href)
    window.location.href = href
}
