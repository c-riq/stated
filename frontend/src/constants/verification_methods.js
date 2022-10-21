// ["Country","Alpha-2 code","Alpha-3 code","Numeric"]
const verificationMethods = [
    {id: "twitter_reference_blue_badge", statement: "We confirm that the companies twitter account is verified by twitter.com and references the domain in question."},
    {id: "linkedin_reference_100_employees", statement: "We confirm that the companies linkedin account has more than 100 employees and references the domain in question."},
    {id: "wikipedia_reference_100_days_unchanged", statement: "We confirm that the companies wikipedia page references the domain in question and that part has not been changed for more than 100 days."},
    {id: "personal_contact_to_employee", statement: "We personally confirmed with a direct employee of the company that this is the companies main domain."},
    {id: "other_source", statement: "We confirm that the organisations main domain is in accordance with the listed source, which we regard as trustworthy and authentic."}
]
module.exports = {verificationMethods}