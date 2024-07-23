import { ObjectDetector, FilesetResolver } from "./vision_bundle.js";
var objectDetector;
let runningMode = "IMAGE";

// モデルの切り替えを行う関数
let modelSwitching = false;

async function switchModel(modelPath) {
    modelSwitching = true;  // モデル切り替え中フラグを設定
    console.log("Switching model to:", modelPath);
    try {
        // モデルの準備
        const vision = await FilesetResolver.forVisionTasks("./wasm");
        // 新しい物体検出器を作成
        const newObjectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: "GPU"
            },
            scoreThreshold: 0.35,
            runningMode: runningMode
        });
        // 古い物体検出器をnullに設定し、新しい物体検出器に置き換える
        if (objectDetector) {
            objectDetector = null;
        }
        objectDetector = newObjectDetector;
        currentModel = modelPath;  // 現在のモデルを更新
        console.log("Model switched successfully to:", modelPath);
    } catch (error) {
        console.error("Failed to switch model:", error);
    } finally {
        modelSwitching = false;  // モデル切り替え中フラグをリセット
    }
}

// 初期化関数
const initializeObjectDetector = async () => {
    await switchModel('./models/mickey.tflite');
    enableCam();
    document.querySelector('#loading').style.display = 'none';
};

// ページロード時に初期化関数を呼び出す
window.addEventListener("load", () => {
    initializeObjectDetector();
});

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
let video = document.getElementById("webcam");
let enableWebcamButton;

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

var children = [];

async function enableCam(event) {
    if (!objectDetector) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }

    const constraints = {
        video: {
            facingMode: 'environment'
        }
    };

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        })
        .catch((err) => {
            console.error(err);
        });
}

let lastVideoTime = -1;
async function predictWebcam() {
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await objectDetector.setOptions({ runningMode: "VIDEO" });
    }
    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime && !modelSwitching) {
        lastVideoTime = video.currentTime;
        const detections = await objectDetector.detectForVideo(video, nowInMs);
        gotDetections(detections);
        handleGestures();
    }
    window.requestAnimationFrame(predictWebcam);
}

document.querySelector('#input_confidence_threshold').addEventListener('change', changedConfidenceThreshold);
function changedConfidenceThreshold(e) {
    objectDetector.setOptions({
        scoreThreshold: e.srcElement.value
    });
    document.querySelector('#confidence_threshold').innerHTML = e.srcElement.value;
}

// ジェスチャー検出結果を処理する関数
let currentModel = './models/mickey.tflite'; // 現在のモデルを保持

function handleGestures() {
    if (gestures_results) {
        for (let i = 0; i < gestures_results.gestures.length; i++) {
            let name = gestures_results.gestures[i][0].categoryName;  // ジェスチャーのカテゴリ名 
            if (name === "Pointing_Up" && currentModel !== './models/mickey.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to mickey.`);
                switchModel('./models/mickey.tflite');
            } else if (name === "Victory" && currentModel !== './models/hanyou.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to hanyou.`);
                switchModel('./models/hanyou.tflite');
            } else if (name === "THREE" && currentModel !== './models/MMickey2.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to MMickey2.`);
                switchModel('./models/MMickey2.tflite');
            } else if (name === "FOUR" && currentModel !== './models/efficientdet_lite0.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to efficientdet_lite0.`);
                switchModel('./models/efficientdet_lite0.tflite');
            }
        }
    }
}
