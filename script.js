document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const viewTitleEl = document.getElementById('view-title');
    const calendarDisplayEl = document.getElementById('calendar-display');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const viewSwitcher = document.getElementById('view-switcher');

    const addEventBtn = document.getElementById('add-event-btn');
    const timelineEl = document.getElementById('timeline');
    const eventModal = document.getElementById('event-modal');
    const memoryModal = document.getElementById('memory-modal');
    const eventForm = document.getElementById('event-form');
    const memoryForm = document.getElementById('memory-form');
    const modals = [eventModal, memoryModal];
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const deleteMemoryBtn = document.getElementById('delete-memory-btn');
    const memoryPhotoInput = document.getElementById('memory-photo');
    const photoPreviewsContainer = document.getElementById('photo-previews');
    const memoryTextInput = document.getElementById('memory-text');
    const aiDialogueElement = memoryModal.querySelector('.ai-dialogue');

    // --- 状態管理 ---
    let currentDate = new Date();
    let currentView = 'month';
    let events = JSON.parse(localStorage.getItem('gokigenEvents')) || [];
    let currentPhotoDataUrls = []; // リサイズ後の写真データURL(複数)を一時的に保持

    // --- データ移行処理 (古い形式のデータを新しい形式に変換) ---
    events = events.map(event => {
        if (event.photoDataUrl && !event.photoDataUrls) {
            event.photoDataUrls = [event.photoDataUrl];
            delete event.photoDataUrl;
        } else if (!event.photoDataUrls) {
            event.photoDataUrls = [];
        }
        return event;
    });
    // saveEvents(); // 初期読み込み後に1回保存

    const saveEvents = () => localStorage.setItem('gokigenEvents', JSON.stringify(events));

    const categories = {
        live: { icon: 'fa-music', name: 'ライブ・イベント'},
        cafe: { icon: 'fa-mug-saucer', name: 'カフェ巡り'},
        travel: { icon: 'fa-plane-departure', name: '旅行'},
        movie: { icon: 'fa-film', name: '映画'},
        special: { icon: 'fa-star', name: '特別な日'},
        other: { icon: 'fa-pencil', name: 'その他'}
    };

    // --- 質問セットの定義 ---
    const questionSets = {
        common: [
            "おかえりなさい！ 今日の『ごきげん体験』、どうでしたか？ 今の率直なキモチを、一言で教えてください！",
            "その体験に、ハッシュタグをつけるとしたら？ (例: #最高すぎた #感動 #リフレッシュ)",
            "今日の体験の「満足度」を星5つで表すとしたら？ (★★★★★)",
            "今日のハイライトを一言でまとめるなら？",
            "誰と一緒でしたか？ もし一人なら、どんな気分でしたか？",
            "今日の体験で、一番心に残った「瞬間」を教えてください。",
            "何か素敵な写真は撮れましたか？",
            "今日の体験を、未来の自分に伝えるとしたら、まず何を伝えますか？",
        ],
        live: [
            "ライブ、最高でしたか？ 今の興奮を言葉にしてください！",
            "今日のライブにハッシュタグをつけるなら？ (例: #神セトリ #推しが尊い #〇〇しか勝たん)",
            "一番テンションが上がった曲、パフォーマンスは何でしたか？",
            "思わず泣いてしまった、感動したシーンはありましたか？",
            "今日のアーティスト（推し）の様子はどうでしたか？",
            "MC（トーク）で印象に残った言葉はありましたか？",
            "セットリスト全体を通して、どう思いましたか？",
            "会場の雰囲気や、周りのファンの盛り上がりはどうでしたか？",
            "席からの眺め（近さ、見え方）はどうでしたか？",
            "一番耳に残っている「音」や「フレーズ」は何ですか？",
            "照明や演出（映像、特効など）で記憶に残っているものは？",
            "「今日のこの曲はいつもと違った！」という発見はありましたか？",
            "サプライズな演出やハプニングはありましたか？",
            "予想外に良かった曲、化けた曲はありましたか？",
            "買ったグッズはありますか？ 一番のお気に入りは？",
            "今日のライブ、100点満点で何点ですか？",
            "次のライブやイベントにも絶対行きたいと思いましたか？",
            "今日の感動を、誰かに一番伝えたいですか？",
            "この日のために頑張ってきてよかったですか？",
            "ライブが終わった今、一番食べたいもの・飲みたいものは何ですか？",
            "今日の思い出を、一言で未来の自分に叫んでください！",
        ],
        cafe: [
            "カフェ（グルメ）でのひととき、いかがでしたか？ 今の「ほっこり度」や「満足度」を教えてください。",
            "そのカフェ（お店）体験にハッシュタグをつけるなら？ (例: #隠れ家カフェ #スイーツ最高 #リピ確定)",
            "今日注文したメニューで、一番「当たり！」だったものは何ですか？",
            "メインで頼んだドリンクやフードの、率直な感想をどうぞ！",
            "味はどうでしたか？（例：甘かった、本格的だった、優しい味）",
            "見た目（盛り付けや食器）はどうでしたか？",
            "お店の雰囲気やインテリア、内装はどうでしたか？",
            "どんな香りがしましたか？（例：コーヒーの香り、焼き菓子の甘い香り）",
            "店内に流れていた音楽や、聞こえてきた音で印象に残ったものは？",
            "席の座り心地や、窓からの景色はどうでしたか？",
            "店員さんの接客やサービスで印象に残ったことはありますか？",
            "このお店の「一番好きなところ」はどこですか？",
            "メニューやお店のシステムで、何か新しい発見はありましたか？",
            "「これは珍しい！」と思ったメニューや食材はありましたか？",
            "誰とどんな話をしましたか？",
            "そこでどんな時間を過ごしましたか？（例：読書、おしゃべり、ぼーっとした）",
            "このカフェ（お店）、リピートしたい度は星いくつ？ (★★★★★)",
            "次に来たら注文してみたい、気になるメニューはありましたか？",
            "今日のカフェタイムを、一言でまとめるなら？",
        ],
        travel: [
            "おかえりなさい！旅行（お出かけ）はどうでしたか？ 今の気分を天気で例えるなら？（例：快晴！）",
            "今回の旅にハッシュタグをつけるなら？ (例: #絶景 #食べ歩き #リフレッシュ #ノープラン旅)",
            "旅全体で、一番「ここに来てよかった！」と思った場所はどこですか？",
            "旅のハイライトシーン、ベストショットの瞬間を教えてください。",
            "最も心に残っている景色は、どんな風景ですか？",
            "旅先で食べたもので、一番「うまい！」と唸ったものは何ですか？",
            "「これは珍しい！」と思った食べ物や飲み物はありましたか？",
            "どんな体験をしましたか？（例：温泉、アクティビティ、史跡巡り、買い物）",
            "その土地の雰囲気や、出会った人々はどうでしたか？",
            "その土地ならではの文化や習慣、言葉に触れましたか？",
            "旅先で印象に残った「音」や「匂い」はありますか？",
            "旅の途中で、何か予想外のハプニングやラッキーな出来事はありましたか？",
            "行く前と後で、その場所へのイメージは変わりましたか？",
            "泊まった宿（ホテル・旅館）はどうでしたか？ 快適でしたか？",
            "自分や誰かのために、お土産は何か買いましたか？",
            "一緒に行った人との、旅の一番の思い出は何ですか？",
            "今回の旅の満足度を、100点満点で教えてください！",
            "次に訪れるなら、どこで何をしたいですか？",
            "この旅の経験を、未来の自分にどう活かしたいですか？",
            "旅の思い出を、一言でまとめると？",
        ],
        movie: [
            "映画鑑賞、お疲れ様です！作品、どうでしたか？",
            "見終わった直後の、率直な感想を一言でお願いします！",
            "その映画にハッシュタグをつけるなら？ (例: #号泣 #考察が止まらない #最高の時間)",
            "一番心に残った、お気に入りのシーンはどこですか？",
            "思わず息をのんだり、鳥肌が立った瞬間はありましたか？",
            "ストーリー全体について、どう思いましたか？",
            "結末（エンディング）は予想通りでしたか？ それとも意外でしたか？",
            "一番好きになったキャラクター、または感情移入したキャラクターは誰ですか？",
            "そのキャラクターのどんなところに惹かれましたか？",
            "映像美やカメラワーク、演出で特に印象的だったところは？",
            "音楽（BGMや主題歌）は映画の雰囲気と合っていましたか？",
            "この映画のテーマや、監督が伝えたかったメッセージは何だと思いましたか？",
            "一番驚いた展開や、見事な伏線回収はありましたか？",
            "見る前と後で、作品の印象は変わりましたか？",
            "映画館の雰囲気（音響や座席）はどうでしたか？",
            "ポップコーンやドリンクは楽しみましたか？ 何味でしたか？",
            "この映画、個人的な満足度は星いくつ？ (★★★★★)",
            "この作品を、他の人にもお勧めしたいですか？",
            "もしもう一度見るとしたら、今度はどこに注目して見たいですか？",
            "この映画から受け取った「一番大切なもの」を一言でまとめるなら？",
        ],
    };

    // --- メイン描画関数 ---
    const render = () => {
        switch (currentView) {
            case 'year': renderYearView(); break;
            case 'month': renderMonthView(); break;
            case 'week': renderWeekView(); break;
        }
        updateActiveViewButton();
    };

    // --- 年表示の描画 ---
    const renderYearView = () => {
        const year = currentDate.getFullYear();
        viewTitleEl.textContent = `${year}年`;
        calendarDisplayEl.innerHTML = '<div id="year-grid"></div>';
        const yearGrid = document.getElementById('year-grid');
        for (let month = 0; month < 12; month++) {
            const miniMonth = document.createElement('div');
            miniMonth.className = 'mini-month';
            miniMonth.addEventListener('click', () => { currentDate.setMonth(month); currentView = 'month'; render(); });
            miniMonth.innerHTML = `<h4>${month + 1}月</h4><div class="mini-calendar" id="mini-cal-${month}"></div>`;
            yearGrid.appendChild(miniMonth);
            const miniCal = document.getElementById(`mini-cal-${month}`);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay();
            for(let i = 0; i < firstDay; i++) miniCal.appendChild(document.createElement('div'));
            for (let day = 1; day <= daysInMonth; day++) {
                const miniDay = document.createElement('div');
                miniDay.className = 'mini-day';
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (events.some(e => e.date === dateStr)) miniDay.classList.add('has-event');
                miniCal.appendChild(miniDay);
            }
        }
    };

    // --- 月表示の描画 ---
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        viewTitleEl.textContent = `${year}年 ${month + 1}月`;
        calendarDisplayEl.innerHTML = '<div class="calendar-grid"></div>';
        const monthGrid = calendarDisplayEl.querySelector('.calendar-grid');
        ['日', '月', '火', '水', '木', '金', '土'].forEach(day => { monthGrid.innerHTML += `<div class="calendar-day-name">${day}</div>`; });
        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) monthGrid.appendChild(document.createElement('div'));
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const thisDate = new Date(year, month, day);
            const dayOfWeek = thisDate.getDay();
            const today = new Date();
            if (dayOfWeek === 0) dayEl.classList.add('sunday');
            if (dayOfWeek === 6) dayEl.classList.add('saturday');
            if (thisDate.toDateString() === today.toDateString()) dayEl.classList.add('today');
            dayEl.innerHTML = `<span class="day-number">${day}</span>`;
            dayEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('calendar-day') || e.target.classList.contains('day-number')) openNewEventModal(dateStr);
            });
            appendEventsToDay(dayEl, dateStr, false); // 月表示では時刻非表示
            monthGrid.appendChild(dayEl);
        }
    };

    // --- 週表示の描画 ---
    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        viewTitleEl.textContent = `${startOfWeek.toLocaleDateString('ja-JP')} - ${endOfWeek.toLocaleDateString('ja-JP')}`;
        calendarDisplayEl.innerHTML = '<div id="week-list"></div>';
        const weekList = document.getElementById('week-list');
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
            const dayItemEl = document.createElement('div');
            dayItemEl.className = 'week-list-item';
            const today = new Date();
            if (day.toDateString() === today.toDateString()) dayItemEl.classList.add('today');
            if (day.getDay() === 6) dayItemEl.classList.add('saturday');
            if (day.getDay() === 0) dayItemEl.classList.add('sunday');
            const dateHeader = document.createElement('div');
            dateHeader.className = 'week-list-date';
            dateHeader.innerHTML = `<span class="date-num">${day.getDate()}</span> <span class="day-name">${['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}</span>`;
            dayItemEl.appendChild(dateHeader);
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'week-events-container';
            dayItemEl.addEventListener('click', (e) => {
                if (!e.target.closest('.event-marker')) openNewEventModal(dateStr);
            });
            if (dayEvents.length > 0) {
                dayEvents.forEach(event => eventsContainer.appendChild(createEventMarker(event, true))); // 週表示では時刻表示
            } else {
                eventsContainer.innerHTML = '<p class="no-events-text">予定はありません</p>';
            }
            dayItemEl.appendChild(eventsContainer);
            weekList.appendChild(dayItemEl);
        }
    };

    // --- ヘルパー: イベントマーカー要素を作成 ---
    const createEventMarker = (event, showTime = false) => {
        const eventEl = document.createElement('div');
        eventEl.className = 'event-marker';
        eventEl.dataset.category = event.category;
        const timePrefix = (event.time && showTime) ? `<span class="event-time">${event.time}</span>` : '';
        eventEl.innerHTML = `${timePrefix}<i class="fa-solid ${categories[event.category].icon}"></i> ${event.title}`;
        const today = new Date(); today.setHours(0,0,0,0);
        const isPast = new Date(event.date) < today;
        if (event.isScrapbooked) {
            eventEl.classList.add('scrapbooked'); eventEl.title = '思い出記録済み';
        } else if (isPast) {
            eventEl.classList.add('past-event'); eventEl.title = 'クリックして思い出を記録する';
            eventEl.addEventListener('click', (e) => { e.stopPropagation(); openMemoryModal(event.id); });
        } else {
            eventEl.title = 'クリックして予定を編集する';
            eventEl.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(event.id); });
        }
        return eventEl;
    };

    // --- ヘルパー: 日にイベントを追加 ---
    const appendEventsToDay = (dayEl, dateStr, showTime) => {
        events.filter(e => e.date === dateStr)
              .sort((a,b) => a.time.localeCompare(b.time))
              .forEach(event => dayEl.appendChild(createEventMarker(event, showTime)));
    };

    // --- イベントリスナー (ナビゲーション、ビュー切り替え) ---
    prevBtn.addEventListener('click', () => {
        if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
        else if (currentView === 'month') { currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() - 1); }
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
        render();
    });
    nextBtn.addEventListener('click', () => {
        if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() + 1);
        else if (currentView === 'month') { currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() + 1); }
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
        render();
    });
    viewSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { currentView = e.target.dataset.view; render(); }
    });
    const updateActiveViewButton = () => {
        document.querySelectorAll('#view-switcher button').forEach(btn => btn.classList.toggle('active', btn.dataset.view === currentView));
    };

    // --- タイムライン描画 ---
    const renderTimeline = () => {
        timelineEl.innerHTML = '';
        const scrapbookEvents = events.filter(e => e.isScrapbooked).sort((a,b) => new Date(b.date) - new Date(a.date));
        if (scrapbookEvents.length === 0) { timelineEl.innerHTML = '<p class="placeholder-text">まだ思い出はありません。</p>'; return; }
        scrapbookEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            const timeDisplay = event.time ? ` ${event.time}` : '';
            let photosHtml = '';
            if (event.photoDataUrls && event.photoDataUrls.length > 0) {
                photosHtml = '<div class="scrapbook-photos-container">';
                event.photoDataUrls.forEach(url => {
                    photosHtml += `<img src="${url}" alt="${event.title}の写真" class="scrapbook-photo">`;
                });
                photosHtml += '</div>';
            }
            // Q&A形式で表示するために memory の改行を <br> に変換
            const memoryDisplay = event.memory ? event.memory.replace(/\n/g, '<br>') : '';

            item.innerHTML = `
                <div class="scrapbook-card">
                    <button class="delete-scrapbook-btn" data-event-id="${event.id}">&times;</button>
                    ${photosHtml}
                    <h4><i class="fa-solid ${categories[event.category].icon}"></i> ${event.title}</h4>
                    <p class="date">${event.date}${timeDisplay}</p>
                    <p class="memory">${memoryDisplay}</p>
                    <button class="share-btn" onclick="alert('「一枚の画像として書き出し」が実行されました！')">
                        <i class="fa-solid fa-share-square"></i> この思い出をシェア
                    </button>
                </div>`;
            timelineEl.appendChild(item);
        });
    };

    // --- モーダル制御 ---
    const openModal = (modal) => modal.style.display = 'flex';
    const closeModal = (modal) => modal.style.display = 'none';

    const openNewEventModal = (dateStr = '') => {
        eventForm.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-date').value = dateStr;
        document.getElementById('event-time').value = '';
        document.getElementById('event-modal-title').textContent = '楽しみな予定（ごきげん）を予約';
        document.getElementById('save-event-btn').textContent = 'この内容で予約する';
        deleteEventBtn.style.display = 'none';
        openModal(eventModal);
    };
    addEventBtn.addEventListener('click', () => openNewEventModal());

    const openEditModal = (eventId) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-time').value = event.time || '';
        document.getElementById('event-category').value = event.category;
        deleteEventBtn.dataset.eventId = event.id;
        document.getElementById('event-modal-title').textContent = '予定の変更';
        document.getElementById('save-event-btn').textContent = '変更を保存する';
        deleteEventBtn.style.display = 'block';
        openModal(eventModal);
    };

    const openMemoryModal = (eventId) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const introMessages = [`「${event.title}」はどうだった？`, `昨日の「${event.title}」、楽しめたみたいだね！`, `「${event.title}」の思い出を聞かせて！`];
        document.getElementById('ai-message-text').textContent = introMessages[Math.floor(Math.random() * introMessages.length)];
        aiDialogueElement.style.display = 'block';

        document.getElementById('memory-modal-title').textContent = `「${event.title}」の思い出`;
        document.getElementById('memory-event-id').value = eventId;
        deleteMemoryBtn.dataset.eventId = event.id;
        memoryForm.reset();
        photoPreviewsContainer.innerHTML = '';
        memoryPhotoInput.value = '';
        currentPhotoDataUrls = [];

        memoryTextInput.style.display = 'none'; // 元のテキストエリア非表示
        memoryTextInput.value = '';

        // QAコンテナの準備
        const existingQaContainer = memoryForm.querySelector('#qa-container');
        if (existingQaContainer) memoryForm.removeChild(existingQaContainer); // 既存を削除
        const qaContainer = document.createElement('div');
        qaContainer.id = 'qa-container';

        // 質問の選択
        let questions = [...questionSets.common];
        if (questionSets[event.category]) {
            questions = questions.concat(questionSets[event.category]);
        }

        // Q&Aフォームの生成
        questions.forEach((question, index) => {
            const questionId = `q-${eventId}-${index}`;
            const label = document.createElement('label');
            label.htmlFor = questionId;
            label.textContent = question;
            const textarea = document.createElement('textarea');
            textarea.id = questionId;
            textarea.rows = 2;
            textarea.placeholder = '自由に書いてね';
            textarea.dataset.question = question;
            qaContainer.appendChild(label);
            qaContainer.appendChild(textarea);
        });

        // フォームに挿入
        memoryForm.insertBefore(qaContainer, memoryPhotoInput.labels[0] || memoryPhotoInput);

        openModal(memoryModal);
    };

    modals.forEach(modal => modal.querySelector('.close-btn').addEventListener('click', () => closeModal(modal)));

    // --- 写真プレビューとリサイズ処理 (複数ファイル対応) ---
    memoryPhotoInput.addEventListener('change', () => {
        photoPreviewsContainer.innerHTML = '';
        currentPhotoDataUrls = [];
        const files = memoryPhotoInput.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    currentPhotoDataUrls.push(resizedDataUrl);
                    const previewImg = document.createElement('img');
                    previewImg.src = resizedDataUrl;
                    previewImg.classList.add('photo-preview-item');
                    photoPreviewsContainer.appendChild(previewImg);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });

    // --- フォーム処理 ---
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventId = document.getElementById('event-id').value;
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            category: document.getElementById('event-category').value,
        };
        if (eventId) {
            const eventIndex = events.findIndex(event => event.id == eventId);
            if (eventIndex > -1) events[eventIndex] = { ...events[eventIndex], ...eventData };
        } else {
            events.push({ id: Date.now(), ...eventData, memory: null, isScrapbooked: false, photoDataUrls: [] });
        }
        saveEvents();
        renderAll();
        closeModal(eventModal);
    });

    deleteEventBtn.addEventListener('click', (e) => {
        const eventIdToDelete = parseInt(e.currentTarget.dataset.eventId);
        if (confirm('この予定を本当に削除しますか？')) {
            events = events.filter(event => event.id !== eventIdToDelete);
            saveEvents();
            renderAll();
            closeModal(eventModal);
        }
    });

    deleteMemoryBtn.addEventListener('click', (e) => {
        const eventIdToDelete = parseInt(e.currentTarget.dataset.eventId);
        if (confirm('この予定を本当に削除しますか？')) {
            events = events.filter(event => event.id !== eventIdToDelete);
            saveEvents();
            renderAll();
            closeModal(memoryModal);
        }
    });

    memoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventId = parseInt(document.getElementById('memory-event-id').value);
        const photoDataUrlsToSave = [...currentPhotoDataUrls]; // 配列をコピー

        let memoryContent = "";
        const qaContainer = memoryForm.querySelector('#qa-container');
        if (qaContainer) {
            const textareas = qaContainer.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                const question = textarea.dataset.question;
                const answer = textarea.value.trim();
                if (answer) {
                    memoryContent += `Q: ${question}\nA: ${answer}\n\n`;
                }
            });
        }
        memoryContent = memoryContent.trim(); // 末尾の改行削除

        const eventIndex = events.findIndex(event => event.id === eventId);
        // Q&Aの回答が入力されている場合のみ保存
        if (eventIndex > -1 && memoryContent) {
            events[eventIndex].memory = memoryContent; // Q&Aテキストを保存
            events[eventIndex].isScrapbooked = true;
            events[eventIndex].photoDataUrls = photoDataUrlsToSave; // 写真の配列を保存
            saveEvents();
            renderAll();
            closeModal(memoryModal);
        } else if (eventIndex > -1 && !memoryContent && photoDataUrlsToSave.length > 0) {
             // 写真はあるがテキストがない場合（今回はテキスト必須とする）
             alert("思い出を入力してください。");
             return; // モーダルを閉じない
        } else if (eventIndex > -1 && !memoryContent){
            // テキストも写真もない場合
             alert("思い出を入力してください。");
             return; // モーダルを閉じない
        }
    });

    // --- タイムライン削除処理 ---
    timelineEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-scrapbook-btn')) {
            const eventIdToDelete = parseInt(e.target.dataset.eventId);
            if (confirm('この思い出のスクラップブックを本当に削除しますか？\n(予定の記録もすべて削除されます)')) {
                events = events.filter(event => event.id !== eventIdToDelete);
                saveEvents();
                renderAll();
            }
        }
    });

    // --- 初期描画 ---
    const renderAll = () => {
        render();
        renderTimeline();
    };
    renderAll();
});