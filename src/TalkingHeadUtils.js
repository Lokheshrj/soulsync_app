export const textToSSML = (text) => {
    return `<speak version='1.0' xml:lang='en-US'>
              <voice name='en-US-JennyNeural'>
                ${text}
              </voice>
            </speak>`;
};

export const azureSpeak = async (ssml) => {
    try {
        const response = await fetch("YOUR_AZURE_TTS_ENDPOINT", {
            method: "POST",
            headers: {
                "Content-Type": "application/ssml+xml",
                "Ocp-Apim-Subscription-Key": "YOUR_AZURE_SUBSCRIPTION_KEY",
            },
            body: ssml,
        });

        if (!response.ok) throw new Error("Azure TTS request failed");

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error("Azure TTS error:", error);
    }
};
