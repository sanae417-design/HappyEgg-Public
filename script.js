
// 初回起動
// LocalStorage読込
// 日付が変わったら0回へリセット
// たまごメーター更新
// GASからランダム取得
// リロードしても同じタスクを表示
// 完了・上振れ登録
// コメントチップ（クリックで入力欄に追加）
// 1日3回になったら抽選ボタンを自動で無効化
// 通信中はボタンを無効化
// エラー時のメッセージ表示


'use strict';

/* ===================================
   設定
=================================== */

const MAX_COUNT = 3;
const STORAGE_KEY = "happyEggData";


/* ===================================
   DOM取得
=================================== */

const todayCount = document.getElementById("todayCount");

const meterEgg1 = document.getElementById("meterEgg1");
const meterEgg2 = document.getElementById("meterEgg2");
const meterEgg3 = document.getElementById("meterEgg3");

const mainEgg = document.getElementById("mainEgg");

const drawButton = document.getElementById("drawButton");

const taskArea = document.getElementById("taskArea");
const taskCategory = document.getElementById("taskCategory");
const taskText = document.getElementById("taskText");

const commentArea = document.getElementById("commentArea");
const completeArea = document.getElementById("completeArea");
    
const comment = document.getElementById("comment");
const message = document.getElementById("message");

// 成長ステータス表示

const weekEgg =
    document.getElementById("weekEgg");

const totalEgg =
    document.getElementById("totalEgg");

const bonusCount =
    document.getElementById("bonusCount");

const eggLevel =
    document.getElementById("eggLevel");

const nextLevel =
    document.getElementById("nextLevel");
    
/* ===================================
   当日データ
=================================== */
let todaySummary = {
    todayComplete: 0,
    todayBonus: 0
};

/* ===================================
   アプリデータ
=================================== */

let happyData = {
    date: "",
    count: 0,
    task: null,
    category: null,
    completed: false
};


/* ===================================
   初期処理
=================================== */

window.addEventListener("DOMContentLoaded", async()=>{

    loadData();

    resetIfNewDay();

    restoreTask();

    setupCommentChip();

    try{

        const summary =
            await getSummary();

        todaySummary = summary;

        updateMeter();

        updateGrowth(summary);

    }
    catch(error){

        console.error(error);

        // GASが取得できない時だけLocalStorageを使う
        updateMeter();

    }

});


/* ===================================
   LocalStorage
=================================== */

function loadData(){

    const saved = localStorage.getItem(STORAGE_KEY);

    if(saved){
        happyData = JSON.parse(saved);
    }

}


function saveData(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(happyData)
    );

}


/* ===================================
   日付処理
=================================== */

function getToday(){

    return new Date()
        .toISOString()
        .slice(0,10);

}


function resetIfNewDay(){

    const today = getToday();

    if(happyData.date !== today){

        happyData = {
            date: today,
            count: 0,
            task: null,
            category: null,
            completed: false
        };

        saveData();

        clearTask();
    }

}


/* ===================================
   たまごメーター
=================================== */

function updateMeter(){

    todayCount.textContent =
    todaySummary.todayComplete;

    const eggs = [
        meterEgg1,
        meterEgg2,
        meterEgg3
    ];

    eggs.forEach((egg,index)=>{

        if(index < happyData.count){
            egg.src = "img/egg.svg";
        }
        else{
            egg.src = "img/egg_gray.svg";
        }

    });


    if(todaySummary.todayComplete >= MAX_COUNT){

        drawButton.disabled = true;

        setMessage(
            "今日は3つのたまご達成しました✨"
        );

    }

}


/* ===================================
   タスク復元
=================================== */

function restoreTask(){

    if(
        happyData.task &&
        !happyData.completed
    ){

        showTask(
            happyData.category,
            happyData.task
        );

    }

}


/* ===================================
   タスク表示
=================================== */

function showTask(category,task){

    taskArea.classList.remove("hidden");

    commentArea.classList.remove("hidden");

    completeArea.classList.remove("hidden");

    taskCategory.textContent = category;

    taskText.textContent = task;

}


function clearTask(){

    taskArea.classList.add("hidden");

    commentArea.classList.add("hidden");

    completeArea.classList.add("hidden");

    taskCategory.textContent = "-";

    taskText.textContent = "-";

}

/* ===================================
   コメントチップ
=================================== */

function setupCommentChip(){

    const chips =
        document.querySelectorAll(".chip");


    chips.forEach(chip=>{

        chip.addEventListener(
            "click",
            ()=>{

                comment.value =
                    chip.textContent;

            }
        );

    });

}


/* ===================================
   メッセージ
=================================== */

function setMessage(text){

    message.textContent = text;

}


/* ===================================
   共通処理
=================================== */

function sleep(ms){

    return new Promise(
        resolve => setTimeout(resolve,ms)
    );

}


/* ===================================
   GAS設定
=================================== */

// 後でGAS WebアプリURLへ変更
const GAS_URL = "https://script.google.com/macros/s/AKfycbwv7t2m-gQ046f_m0b4cZ4ISkhQH-YfJ7mqoy6M9Zd4y8h-Dx2hbHV_CjpHcZyUcffa/exec";


/* ===================================
   たまご抽選
=================================== */

drawButton.addEventListener("click", async()=>{

    if(happyData.count >= MAX_COUNT){

        setMessage(
            "今日はもう3回達成しています✨"
        );

        return;

    }


    drawButton.disabled = true;

    setMessage(
        "たまごを割っています..."
    );


    try{

        await eggAnimation();


        const data =
            await getRandomTask();


        if(!data){

            setMessage(
                "タスク取得に失敗しました"
            );

            drawButton.disabled = false;

            return;

        }


        happyData.task =
            data.task;

        happyData.category =
            data.category;

        happyData.completed =
            false;


        saveData();


        showTask(
            data.category,
            data.task
        );


        setMessage(
            "今日の小さな一歩です🥚"
        );


    }
    catch(error){

        console.error(error);

        setMessage(
            "通信エラーが発生しました"
        );

    }


    drawButton.disabled = false;

});



/* ===================================
   たまご演出
=================================== */

async function eggAnimation(){

    mainEgg.classList.add("shake");


    await sleep(500);


    mainEgg.classList.remove("shake");


    mainEgg.src =
        "img/egg_open.svg";


    mainEgg.classList.add("open");


    await sleep(500);

}



/* ===================================
   GASからタスク取得
=================================== */

async function getRandomTask(){

    const response =
        await fetch(GAS_URL);


    console.log(
        "GAS status:",
        response.status
    );


    const text =
        await response.text();


    console.log(
        "GAS response:",
        text
    );


    if(!response.ok){

        throw new Error(
            "GAS Error"
        );

    }


    const data =
        JSON.parse(text);


    return data;

}

/* ===================================
   GASから履歴集計取得
=================================== */

async function getSummary(){

    const response =
        await fetch(
            GAS_URL + "?action=summary"
        );


    if(!response.ok){

        throw new Error(
            "Summary Error"
        );

    }


    return await response.json();

}

/* ===================================
   成長ステータス更新
=================================== */

function updateGrowth(summary){


    const weekEggCount =
        summary.weekComplete
        +
        summary.weekBonus;


    const totalEggCount =
        summary.totalComplete
        +
        summary.totalBonus;



    weekEgg.textContent =
        weekEggCount + "個";


    totalEgg.textContent =
        totalEggCount + "個";


    bonusCount.textContent =
        summary.totalBonus + "回";


    updateEggLevel(totalEggCount);

}

function updateEggLevel(total){


    let level;
    let next;


    if(total < 10){

        level = "🥚 たまご";
        next = 10 - total;

    }
    else if(total < 50){

        level = "🐣 ピヨピヨ";
        next = 50 - total;

    }
    else if(total < 150){

        level = "🐥 ひよっこ";
        next = 150 - total;

    }
    else if(total < 300){

        level = "🐤 立派なひよこ";
        next = 300 - total;

    }
    else if(total < 500){

        level = "🕊️ 羽ばたき";
        next = 500 - total;

    }
    else{

        level = "🌈 しあわせの鳥";
        next = 0;

    }


    eggLevel.textContent =
        level;


    if(next > 0){

        nextLevel.textContent =
            "あと" + next + "個";

    }
    else{

        nextLevel.textContent =
            "最高レベル✨";

    }

}

/* ===================================
   DOM追加取得 完了処理
=================================== */

window.addEventListener("DOMContentLoaded", ()=>{

    const completeButton =
        document.getElementById("completeButton");

    const bonusButton =
        document.getElementById("bonusButton");


    completeButton.addEventListener(
        "click",
        ()=>{
            saveResult(0);
        }
    );


    bonusButton.addEventListener(
        "click",
        ()=>{
            saveResult(1);
        }
    );

});


/* ===================================
   実績登録
=================================== */

async function saveResult(bonus){

    if(!happyData.task){

        setMessage(
            "タスクがありません"
        );

        return;

    }


    completeButton.disabled = true;

    bonusButton.disabled = true;

    setMessage(
        "記録しています... ✨"
    );

    const logData = {

        date:
            new Date().toLocaleString(
                "ja-JP"
            ),

        category:
            happyData.category,

        task:
            happyData.task,

        count:
            happyData.count + 1,

        bonus:
            bonus,

        comment:
            comment.value.trim()

    };


    try{

        await postLog(logData);

        happyData.completed = true;

        happyData.task = null;

        happyData.category = null;


        saveData();


        updateMeter();


        // 成長ステータス更新
        try{

            const summary =
                await getSummary();

            todaySummary = summary;

            updateMeter();

            updateGrowth(summary);

        }
        catch(error){

            console.error(
                "Summary update error",
                error
            );

        }


        clearTask();

        mainEgg.src = "img/egg.svg";

        comment.value = "";

        if(happyData.count >= MAX_COUNT){

            setMessage(
                "今日のたまごを全部達成しました🎉"
            );

        }
        else{

            setMessage(
                "お疲れさまでした✨ 次のたまごへ"
            );

        }


    }
    catch(error){

        console.error(error);


        setMessage(
            "登録に失敗しました"
        );


    }


    completeButton.disabled = false;

    bonusButton.disabled = false;


}



/* ===================================
   GASへ履歴送信
=================================== */

async function postLog(data, retry = true){

    const formData =
        new URLSearchParams();

    formData.append(
        "data",
        JSON.stringify(data)
    );


    try{

        const response =
            await fetch(
                GAS_URL,
                {
                    method:"POST",
                    body:formData
                }
            );


        if(!response.ok){

            throw new Error(
                "POST Error"
            );

        }


        return await response.json();


    }
    catch(error){

        if(retry){

            console.log(
                "再送します..."
            );


            await sleep(1000);


            return await postLog(
                data,
                false
            );

        }


        throw error;

    }

}



/* ===================================
   初期状態制御
=================================== */

function resetButtons(){

    completeButton.disabled = false;

    bonusButton.disabled = false;

}


/* ===================================
   画面終了処理
=================================== */

function finishToday(){

    drawButton.disabled = true;

    completeButton.disabled = true;

    bonusButton.disabled = true;

}