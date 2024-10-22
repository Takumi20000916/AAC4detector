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
    await switchModel('./models/kidsmodel.tflite');
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
            facingMode: 'environment',
            // width: { ideal: 400 }, // 幅を設定
            // height: { ideal: 800 } // 高さを設定
        }
    };

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", () => {
                adjustCanvas(); // カメラのストリームが開始された後にキャンバスを調整
                predictWebcam();
            });
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
let currentModel = './models/kidsmodel.tflite'; // 現在のモデルを保持

function handleGestures() {
    if (gestures_results) {
        for (let i = 0; i < gestures_results.gestures.length; i++) {
            let name = gestures_results.gestures[i][0].categoryName;  // ジェスチャーのカテゴリ名 
            if (name === "Pointing_Up" && currentModel !== './models/kidsmodel.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to kidsmodel.`);
                switchModel('./models/kidsmodel.tflite');
            } else if (name === "Victory" && currentModel !== './models/detail.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to detail.`);
                switchModel('./models/detail.tflite');
            } else if (name === "THREE" && currentModel !== './models/tempereture.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to tempereture.`);
                switchModel('./models/tempereture.tflite');
            } else if (name === "FOUR" && currentModel !== './models/container3.tflite') {
                console.log(`Gesture: ${name} detected. Switching model to container3.`);
                switchModel('./models/container3.tflite');
            }
        }
    }
}

function adjustCanvas() {
    let video = document.querySelector('#webcam');
    let canvas = document.querySelector('canvas');
    if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
}
