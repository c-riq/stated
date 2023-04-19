

const { parseRating, parseStatement } = require('./statementFormats')

test('parse rating', () => {
    const exampleRating = `Domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content:
	Type: Rating
	Organisation name: AMBOSS GmbH
	Organisation domain: amboss.com
	Our rating: 5/5 Stars
	Comment:
`
    const parsedStatement = parseStatement(exampleRating)
    const parsedRating = parseRating(parsedStatement.content)
    const rating = parsedRating.rating
    expect(rating).toBe('5/5 Stars');
});
