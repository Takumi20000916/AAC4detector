// バージョン情報
let version = `
last modified: 2023/06/01 01:34:31
`;




// 物体検出結果およびジェスチャー結果を格納する変数
var object_results;
let gestures_results;

let rearCamera;
let cameraInitialized = false


// P5.jsのセットアップ
function setup() {
    // P5.jsのキャンバスを作成し、HTMLの要素に関連付ける
    let p5canvas = createCanvas(400, 400);
    p5canvas.parent('#canvas');

    document.querySelector('#version').innerHTML = version;

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            rearCamera = devices.find(device => device.kind === 'videoinput' && device.label.toLowerCase().includes('back'));

            if (rearCamera) {
                initializeCamera();
            } else {
                console.error('バックカメラが見つかりませんでした。');
            }
        })
        .catch(error => {
            console.error('カメラ情報取得エラー:', error);
        });

    // ジェスチャー結果を取得する関数
    gotGestures = function (results) {
        gestures_results = results;
        adjustCanvas();
    }


    // ものが見つかると以下の関数が呼び出される．resultsに検出結果が入っている．
    gotDetections = function (_results) {
        object_results = _results;
        strokeWeight(5)
        let video_width = document.querySelector('#webcam').videoWidth;
        let video_height = document.querySelector('#webcam').videoHeight;// object_results.detections内の各物体検出に対するループ

        // object_results.detections内の各物体検出に対するループ
        for (let d of object_results.detections) {
            let bb = d.boundingBox;// バウンディングボックス（bb）は、現在の物体検出に関連する情報を含むオブジェクト
            let ratio = {// ratioオブジェクトは、キャンバスサイズとウェブカメラ映像サイズとの比率を計算
                x: width / video_width,
                y: height / video_height
            };
            bb.originX = ratio.x * bb.originX;// バウンディングボックスのX座標をキャンバスサイズに合わせて調整
            bb.originY = ratio.y * bb.originY;// バウンディングボックスのY座標をキャンバスサイズに合わせて調整
            bb.width *= ratio.x;// バウンディングボックスの幅をキャンバスサイズに合わせて調整
            bb.height *= ratio.y;// バウンディングボックスの高さをキャンバスサイズに合わせて調整
        }
        adjustCanvas();
    }
    document.querySelector('#version').innerHTML = version;// バージョン情報を表示

    gotGestures = function (results) {
        gestures_results = results;
        handleGestures(); // ジェスチャー結果の処理を呼び出す
    }
}

function initializeCamera() {
    const constraints = {
        video: {
            facingMode: { exact: 'environment' }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            // カメラストリームの処理
            cameraInitialized = true;
        })
        .catch(error => {
            console.error('カメラ起動エラー:', error);
        });
}



const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();
let isSpeaking = false; // 読み上げ中かどうかを示すフラグ

function speakText() {
    synth.speak(utterance);
    isSpeaking = true; // 読み上げ中フラグを設定

    utterance.onend = function (event) {
        // 読み上げが完了したときの処理
        isSpeaking = false; // 読み上げが完了したらフラグをリセット
    };
}
let count = 0;
//pointing_upの時に<button id="speakButton">音声読み上げ</button>ボタンをクリックしたことにして、テキストを読み上げる
function handleGestures() {
    if (gestures_results) {
        for (let i = 0; i < gestures_results.gestures.length; i++) {
            let name = gestures_results.gestures[i][0].categoryName;  // ジェスチャーのカテゴリ名 
            if (name === "Pointing_Up" || name === "Victory" || name === "THREE" || name === "FOUR") {
                noFill();
                noStroke();
                rect(0, 0, 640, 480);
                stroke(250);
                document.querySelector('#speakButton').click();
                
            }
        }
    }
}
//ボタンが押されたら読み上げるが、1回読み上げたらもう読み上げない

document.querySelector('#speakButton').addEventListener('click', () => {
    
    if(!count == 1){
        utterance.text = "音声読み上げ開始";
        speakText();
        count = 1;
    }
    for (let detection of object_results.detections) {
        let index = detection.categories[0].index;// カテゴリのインデックスを取得
        let bb = detection.boundingBox;// バウンディングボックス（物体の境界ボックス）情報を取得
        let name = detection.categories[0].categoryName;// 物体のカテゴリ名を取得
        let score = detection.categories[0].score;// 物体検出の信頼度を取得
        let c = getColorByIndex(index);// カテゴリに対応する色を取得
        c = [...c, 250];// 色に透明度（Alpha）の値を追加して、半透明に設定
        stroke(c);//矩形（personとか書いてあるとこ）の枠線の色を設定
        strokeWeight(2);
        noFill();
        //人差し指より完全に上にある物体で一番近い物体のバウンディングボックスのみを表示
        if (bb.originX < Pointing_x && bb.originX + bb.width > Pointing_x && bb.originY + bb.height < Pointing_y) {
            rect(bb.originX, bb.originY, bb.width, bb.height);// バウンディングボックスを描画

            fill(c);
            // バウンディングボックスの下に別の矩形を描画
            rect(bb.originX, bb.originY - 20, bb.width, 20);
            //もし名前がpersonだったら、人、robotだったらロボット、banabaだったらバナナと表示
            if (name === "14-green_tea") {
                name = "緑茶";
            } else if (name === "17-jasmine_tea") {
                name = "ジャスミン茶";
            } else if (name === "18-barley_tea") {
                name = "麦茶";
            }else if (name === "29-cider") {
                name = "サイダー";
            } else if (name === "35-peach") {
                name = "ピーチ";
            }else if (name === "25-unsweetened_coffee") {
                name = "ブラックコーヒー";
            } else if (name === "13-water") {
                name = "水";
            }else if (name === "31-sports") {
                name = "スポーツドリンク";
            }
            
            
            //情報の表示
            noStroke();
            fill(255);
            textSize(20);
            textAlign(LEFT, CENTER);
            text(`${name} - ${score.toFixed(2)} `, bb.originX + 10, bb.originY - 10);// カテゴリ名と信頼度を描画
            if(!isSpeaking){
                utterance.text = name + "が見えています";
                speakText();
            }
            index++;
        }
        
    }
});

let Pointing_x;
let Pointing_y;
function draw() {

    clear();
    // console.log(count);
    if (gestures_results) {      
        // もしジェスチャーの結果が存在する場合、以下の処理を実行
        if (gestures_results.landmarks) {
                   
            for (const landmarks of gestures_results.landmarks) {
                noStroke();  // 線を描かない
                fill(100, 150, 210);  // 円の塗りつぶし色を指定
                Pointing_x = gestures_results.landmarks[0][8].x * width;
                Pointing_y = gestures_results.landmarks[0][8].y * height;
                circle(Pointing_x, Pointing_y, 10);  // 特徴点の位置に円を描画
            }
        }
    
        // ジェスチャーの結果を表示する Pointing_Upは3番目
        for (let i = 0; i < gestures_results.gestures.length; i++) {
            // 各検出されたジェスチャーの情報を処理
            noStroke();  // 線を描かない
            fill(255, 0, 0);  // 文字の色を指定
            textSize(20);  // テキストのサイズを指定
    
            // ジェスチャーの情報を変数に格納
            let name = gestures_results.gestures[i][0].categoryName;  // ジェスチャーのカテゴリ名

            textSize(30);  // 大きなテキストサイズを指定
            fill(0);  // 文字の色を指定
            text(name, 100,100);
        }   
        handleGestures();
    }
}




// 特定のインデックスに対応する色を返す関数
// インデックスに対応する色のリスト
function getColorByIndex(index) {
    const colors = [
        [221, 160, 221], // プラム
        [240, 128, 128], // ライトコーラル
        [173, 216, 230], // ライトブルー
        [144, 238, 144], // ライトグリーン
        [220, 220, 220], // グレイ
        [244, 164, 96],  // ライトサーモン
        [192, 192, 192], // シルバー
        [255, 222, 173], // ナバホホワイト
        [175, 238, 238], // パオダーターコイズ
        [255, 228, 196], // ビスク
        [250, 128, 114], // サーモン
        [152, 251, 152], // パレグリーン
        [176, 224, 230], // パウダーブルー
        [255, 218, 185], // ピーチパフ
        [240, 230, 140], // カーキ
        [240, 128, 128], // ライトコーラル
        [144, 238, 144], // ライトグリーン
        [192, 192, 192], // シルバー
        [255, 228, 196], // ビスク
        [250, 128, 114]  // サーモン
    ];

    if (index < 0) {
        index = 0;
    }

    index = index % colors.length;

    return colors[index];
}

// キャンバスのサイズを調整する関数
function adjustCanvas() {
    // ウェブカメラの映像サイズに合わせてキャンバスのサイズを調整
    var element_webcam = document.getElementById('webcam');
    resizeCanvas(element_webcam.clientWidth, element_webcam.clientHeight);
    //console.log(element_webcam.clientWidth);
}

// カメラの再生/停止を切り替える関数
function toggleCameraPlay() {
    let element_video = document.querySelector('#webcam');
    if (element_video.paused) {
        element_video.play();
    } else {
        element_video.pause();
    }
}

