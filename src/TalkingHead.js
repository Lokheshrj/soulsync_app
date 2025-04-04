import React, { useEffect, useRef, useState } from "react";
import { TalkingHead } from "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/modules/talkinghead.mjs";
import { useLocation } from 'react-router-dom';
// Define Azure Blendshape Map
export const AzureBlendshapeMap = [
    "eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft",
    "eyeLookUpLeft", "eyeSquintLeft", "eyeWideLeft", "eyeBlinkRight",
    "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight",
    "eyeSquintRight", "eyeWideRight", "jawForward", "jawLeft", "jawRight",
    "jawOpen", "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft",
    "mouthRight", "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft",
    "mouthFrownRight", "mouthDimpleLeft", "mouthDimpleRight", "mouthStretchLeft",
    "mouthStretchRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower",
    "mouthShrugUpper", "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft",
    "mouthLowerDownRight", "mouthUpperUpLeft", "mouthUpperUpRight", "browDownLeft",
    "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
    "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "noseSneerLeft",
    "noseSneerRight", "tongueOut", "headRotateZ"
];

const TalkingHeadComponent = () => {
    const location = useLocation();
    const { id, name, link, voice } = location.state || {};
    const avatarRef = useRef(null);
    const [loadingText, setLoadingText] = useState("Loading...");
    const [text, setText] = useState("");
    const [head, setHead] = useState(null);
    const [speechSDK, setSpeechSDK] = useState(null);
    const azureRegionRef = process.env.REACT_APP_AZURE_REGION;
    const azureKeyRef = process.env.REACT_APP_AZURE_KEY;
    useEffect(() => {
        let talkingHeadInstance;

        async function initializeTalkingHead() {
            if (head) return;
            console.log("Initializing Talking Head...");

            // Dynamically import TalkingHead
            const { TalkingHead } = await import("https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/modules/talkinghead.mjs");

            talkingHeadInstance = new TalkingHead(avatarRef.current, {
                ttsEndpoint: "/gtts/",
                cameraView: "upper",
            });
            setHead(talkingHeadInstance);

            try {
                await talkingHeadInstance.showAvatar(
                    {
                        url: `${link}?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png`,
                        body: 'F',
                    },
                    (ev) => {
                        if (ev.lengthComputable) {
                            setLoadingText(`Loading ${Math.round((ev.loaded / ev.total) * 100)}%`);
                        } else {
                            setLoadingText(`Loading... ${Math.round(ev.loaded / 1024)} KB`);
                        }
                    }
                );
                setLoadingText("");
            } catch (error) {
                console.error("Error loading avatar:", error);
                setLoadingText("Failed to load avatar.");
            }
        }

        async function loadSpeechSDK() {
            if (speechSDK) return;
            console.log("Loading Speech SDK...");
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js";
            script.async = true;
            script.onload = () => {
                console.log("Speech SDK Loaded!");
                setSpeechSDK(window.SpeechSDK);
            };
            script.onerror = () => console.error("Failed to load Speech SDK.");
            document.body.appendChild(script);
        }

        initializeTalkingHead();
        loadSpeechSDK();

        return () => {
            talkingHeadInstance?.stop();
        };
    }, []);

    // const handleSpeak = () => {
    //     if (!text.trim()) return;
    //     const ssml = `
    //         <speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
    //             <voice name="en-US-EmmaNeural">
    //                 <mstts:viseme type="FacialExpression" />
    //                 ${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    //             </voice>
    //         </speak>
    //     `;
    //     azureSpeak(ssml);
    // };
    const handleSpeak = async () => {
        if (!text.trim()) return;

        setLoadingText("Fetching response...");
        const backend_url = process.env.REACT_APP_BACKEND_URL;
        try {
            // Send user input to backend
            const response = await fetch(`${backend_url}/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "user_input": text })  // Send as a dict
            });

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch response");
            }
            const data = await response.json();
            console.log("API Response:", data); // Debugging log

            // Ensure bot_reply exists
            if (!data || !data.reply) {
                console.error("Error: API response does not contain 'reply'.");
                return;
            }
            setLoadingText("Generating speech...");

            // Send the backend response to Azure TTS
            const ssml = `
                <speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
                    <voice name="${voice}">
                        <mstts:viseme type="FacialExpression" />
                        ${data.reply.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                    </voice>
                </speak>
            `;

            azureSpeak(ssml);
        } catch (error) {
            console.error("Error fetching response:", error);
            setLoadingText("Error fetching response.");
        }
    };


    let microsoftSynthesizer = null;
    let azureBlendShapesBuffer = {};
    let azureBlendShapes = { frames: [], frameRate: 60 };
    let speak = { audio: [], visemes: [], vtimes: [], anim: {} };

    function azureSpeak(ssml) {
        if (!speechSDK) {
            console.error("Speech SDK is not loaded yet.");
            alert("Speech SDK is still loading. Please try again in a few seconds.");
            return;
        }

        if (!microsoftSynthesizer) {
            const regionValue = azureRegionRef;
            const keyValue = azureKeyRef;

            if (!regionValue || !keyValue) {
                alert("Please enter your Azure TTS key and region." + regionValue + keyValue);
                return;
            }

            const config = speechSDK.SpeechConfig.fromSubscription(keyValue, regionValue);
            config.speechSynthesisOutputFormat = speechSDK.SpeechSynthesisOutputFormat.Raw22050Hz16BitMonoPcm;
            microsoftSynthesizer = new speechSDK.SpeechSynthesizer(config, null);

            microsoftSynthesizer.visemeReceived = (s, e) => {
                try {
                    if (e.animation) {
                        const animation = JSON.parse(e.animation);
                        const frameIndex = animation.FrameIndex;
                        const currentLength = azureBlendShapes.frames.length;
                        if (frameIndex === currentLength) {
                            azureBlendShapes.frames.push(...animation.BlendShapes);
                            let nextIndex = frameIndex + 1;
                            while (azureBlendShapesBuffer[nextIndex]) {
                                azureBlendShapes.frames.push(...azureBlendShapesBuffer[nextIndex]);
                                delete azureBlendShapesBuffer[nextIndex];
                                nextIndex++;
                            }
                        } else {
                            azureBlendShapesBuffer[frameIndex] = animation.BlendShapes;
                        }
                    }
                } catch (error) {
                    console.error("Error processing viseme data:", error);
                }
            };
        }

        microsoftSynthesizer.speakSsmlAsync(
            ssml,
            (result) => {
                if (result.reason === speechSDK.ResultReason.SynthesizingAudioCompleted) {
                    speak.audio = [result.audioData];
                    const vs = {};
                    AzureBlendshapeMap.forEach((mtName, i) => {
                        vs[mtName] = [0, ...azureBlendShapes.frames.map(frame => frame[i])];
                    });
                    speak.anim = { name: "blendshapes", dt: Array(azureBlendShapes.frames.length).fill(1000 / azureBlendShapes.frameRate), vs };
                    head?.speakAudio(speak, {}, null);
                }
            },
            (error) => {
                console.error("Azure speech synthesis error:", error);
            }
        );
    }

    return (
        <div>
            <div id="avatar" ref={avatarRef} style={{ width: "100%", height: "700px", background: "black" }}>
            </div>
            <p>{loadingText}</p>
            <button onClick={handleSpeak}>Speak</button>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text to speak" />

            {/* <input type="text" ref={azureRegionRef} placeholder="Azure Region" />
            <input type="text" ref={azureKeyRef} placeholder="Azure Key" /> */}
        </div>
    );
};

export default TalkingHeadComponent;