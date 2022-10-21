

const forbiddenChars = (s) => /;|>|<|=|"|'|’|\\--/.test(s)


const data = [
    ['a', false],
    ['a dj"dk qmdj', true],
    ["a dj'dk qmdj", true],
    ['a dj;dk qmdj', true],
    ['a dj\\--dk qmdj', true], // why?
    ['a dj>dk qmdj', true],
    ['a dj<dk qmdj', true],
    ['a dj=dk qmdj', true],
    ['a’', true],
    ['a sjdfklsjdkflseieht *&$#@!%§±|[]{}/?_~,.\ ', false],
    ['a', false],
    ['https://www.google.com/search?client=firefox-b-d&q=verifier', false]
]

console.log(data.map(d=>forbiddenChars(d[0]) === d[1])
    .reduce(
        (prev, curr) => prev && curr,
        true), data.map(d=>[forbiddenChars(d[0]),d[1]])
)

