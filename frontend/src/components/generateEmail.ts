
export const generateEmail = ({statement, hash}:{statement:string, hash:string}) => {
    const email = `stated@${window.location.host.replace('stated.','')}`
    const urlEncodedSubject = encodeURIComponent('Publish a statement')
    const intro = 'Please distribute the following statement on our behalf:'
    const appendix = 'To increase your confidence rating, we provide evidence below which '+
    '\n\t (1) show that the website domain name of this email account belongs to the author of the statement such as'+
    '\n\t\t (1.1) an official document linking the domain and organisation identiy or'+
    '\n\t\t (1.2) a link to an stated organisation verification statment,'+
    '\n\t (2) show that the owner of this email is authorized to represent our organisation.'
    const urlEncodedbody = encodeURIComponent(`${intro}\n\n\n${statement}\n\n\nhash: ${hash}\n\n\n${appendix}`)
    const href = `mailto:${email}?subject=${urlEncodedSubject}&body=${urlEncodedbody}`
    console.log(href)
    window.location.href = href
}