//import('jest').Config

const {matchQuestion} = require('../gpt')

//\nNL: Wat is je favoriete gerecht en waarom?
//\n[NL]: Gaat deze opgaande trend nog lang door?
//\n[nl] Wat zijn enkele krachtige argumenten voor het behoud van oude gebouwen?
//expect(models.testing.calcNextInterval(0, 0, false)).toBe(0)
describe('matchQuestion', () => {
    let expected = ['nl', 'Heeft u een kat?', 'en', 'Do you have a cat?']
    it.each([
        ["\nnl: Heeft u een kat?\nen: Do you have a cat?", expected],
        ["\n[NL]: Heeft u een kat?\n[EN]: Do you have a cat?",
            ['NL', 'Heeft u een kat?', 'EN', 'Do you have a cat?']],
        ["\n[nl] Heeft u een kat?\n[en] Do you have a cat?", expected],
        ["[NL] Wat is je favoriete kleur? [EN] What is your favorite color?",
            ["NL", "Wat is je favoriete kleur?", "EN", "What is your favorite color?"]]
    ])("when the input is '%s'", (text, expected) => {
        expect(matchQuestion(text)).toEqual(expected)
    })
})
test('matchQuestion no valid matched', () => {
    expect(matchQuestion('')).toBeFalsy()
    expect(matchQuestion('not the known format, uk: hello')).toBeFalsy()
})
