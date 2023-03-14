// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const fs = require('fs')
const client = new speech.SpeechClient();

/**
 * Calls the Speech-to-Text API on a demo audio file.
 */
async function quickstart() {
// The path to the remote LINEAR16 file stored in Google Cloud Storage
    const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';
    const fileName = '/home/paul/win-vr/myintro.flac'
    const file = fs.readFileSync(fileName)
    const audio = {
        //uri: gcsUri,
        content: file.toString('base64')
    };
    const config = {
        encoding: 'FLAC',
        sampleRateHertz: 16000,
        languageCode: 'nl-NL',
    };
    const request = {
        audio: audio,
        config: config,
    };

    // Detects speech in the audio file
//  const [response] = await client.recognize(request);
    const [op] = await client.longRunningRecognize(request).catch(err => {
        console.log("setup", err)
    })
    const [response] = await op.promise().catch(err => {
        console.log("waiting", err)
    });
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Transcription: ${transcription}`);
}

quickstart();