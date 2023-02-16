function matchQuestion(text) {
    const regex = /([\w\ ]+)/g
    try {
        let matches = text.match(regex)
        matches = matches.map(str => str.trim())
        // i'm too lazy to fix the regex, can end up with blank fragments. This removes ""
        matches = matches.filter(String)
        if (matches.length == 4 &&
            matches[0].length == 2 &&
            matches[2].length == 2) {
            matches[1] += '?'
            matches[3] += '?'
            return matches
        } else {
            return false
        }
    } catch (err) {
        return false
    }
}


module.exports = {matchQuestion: matchQuestion}