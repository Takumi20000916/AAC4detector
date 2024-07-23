//8番が人差し指の先

import { GestureRecognizer, FilesetResolver } from "./vision_bundle.js";



//document.getElementById("message").innerHTML = "Loading model...";
let gestureRecognizer = undefined;
let runningMode = "VIDEO";
let webcamRunning = false;

const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://raw.githubusercontent.com/Takumi20000916/PVTF_URL/a2e2a46a24d9abe67a5bd4bd13a2925e30239d6a/PVTF.task",
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 2
    });
    //document.getElementById("message").innerHTML += "done";

    // ジェスチャー認識モデルが読み込まれた後に自動的にカメラを有効にする
    enableCam();
};
createGestureRecognizer();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");

// ウェブカメラアクセスがサポートされているかを確認
const hasGetUserMedia = () => { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };

async function enableCam() {
    if (!gestureRecognizer) {
        console.log("Wait! model file of Gesture Recognizer is not loaded yet.");
        return;
    }
    if (webcamRunning === false) {
        webcamRunning = true;
        const constraints = {
            video: true
        };
        // ウェブカメラストリームを有効化
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        });
    }
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
    }
    gotGestures(results);
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

