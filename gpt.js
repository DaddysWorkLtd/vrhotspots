function matchQuestion(text, question = true) {
//    const regex = /([\w\ ]+)/g
    // you can use the \p{L} property to match any letter character, regardless of whether it is ASCII or not.
    const regex = /([\p{L} ,;']+)/gu
    try {
        /* now getting back for spanish:
[es] Esta palabra puede utilizarse para describir un lugar húmedo y oscuro, como una cueva.

[nl] Dit woord kan worden gebruikt om een vochtige en donkere plaats, zoals een grot, te beschrijven.

Languages: [es] Spanish, [nl] Dutch.
         */
        let matches = text.match(regex)

        matches = matches.map(str => str.trim())
        // i'm too lazy to fix the regex, can end up with blank fragments. This removes ""
        matches = matches.filter(String)
        if (matches.length >= 4 &&
            matches[0].length == 2 &&
            matches[2].length == 2) {
            matches[1] += question ? '?' : '.'
            matches[3] += question ? '?' : '.'
            return matches
        } else {
            return false
        }
    } catch (err) {
        return false
    }
}


module.exports = {matchQuestion: matchQuestion}