import fs from "fs"

const saplingKey = fs.readFileSync("../sapling.key", 'utf8').trim()
import {Client} from "@saplingai/sapling-js/client";

const client = new Client(saplingKey);
//orig - Vandaag, ik heb een geel stijfe rug omdat ik heb televisie kijken
//Sapling 1.0 - Vandaag heb ik een geel stijfe rug omdat ik televisie heb kijken
//davinci 3.0 - Vandaag heb ik een stijve rug gekregen omdat ik televisie heb gekeken.
//gpt 3.5 - Vandaag heb ik een stijve gele rug omdat ik televisie heb gekeken.
//Paul 50.10 - Vandaag heb ik een heel stijve rug omdat ik televisie heb gekeken.
client
    .edits('andaag heb ik een geel stijfe rug omdat ik televisie heb kijken', 'uid', {lang: 'nl', autoApply: true})
    .then(function (response) {
        console.log(response.data);
    })