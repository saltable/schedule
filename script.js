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
    const photoPreview = document.getElementById('photo-preview');

    // --- 状態管理 ---
    let currentDate = new Date();
    let currentView = 'month';
    let events = JSON.parse(localStorage.getItem('gokigenEvents')) || [];
    let resizedPhotoDataUrl = null; // リサイズ後の写真データを一時的に保持

    const saveEvents = () => localStorage.setItem('gokigenEvents', JSON.stringify(events));

    const categories = {
        live: { icon: 'fa-music', name: 'ライブ・イベント'},
        cafe: { icon: 'fa-mug-saucer', name: 'カフェ巡り'},
        travel: { icon: 'fa-plane-departure', name: '旅行'},
        movie: { icon: 'fa-film', name: '映画'},
        special: { icon: 'fa-star', name: '特別な日'},
        other: { icon: 'fa-pencil', name: 'その他'}
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
            const photoDisplay = event.photoDataUrl ? `<img src="${event.photoDataUrl}" alt="${event.title}の写真" class="scrapbook-photo">` : '';
            item.innerHTML = `
                <div class="scrapbook-card">
                    <button class="delete-scrapbook-btn" data-event-id="${event.id}">&times;</button>
                    ${photoDisplay}
                    <h4><i class="fa-solid ${categories[event.category].icon}"></i> ${event.title}</h4>
                    <p class="date">${event.date}${timeDisplay}</p>
                    <p class="memory">${event.memory.replace(/\n/g, '<br>')}</p>
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
        const aiMessages = [`「${event.title}」はどうだった？`, `昨日の「${event.title}」、楽しめたみたいだね！`, `「${event.title}」の思い出を聞かせて！`];
        document.getElementById('ai-message-text').textContent = aiMessages[Math.floor(Math.random() * aiMessages.length)];
        document.getElementById('memory-modal-title').textContent = `「${event.title}」の思い出`;
        document.getElementById('memory-event-id').value = eventId;
        deleteMemoryBtn.dataset.eventId = event.id;
        memoryForm.reset();
        photoPreview.src = '';
        memoryPhotoInput.value = '';
        resizedPhotoDataUrl = null;
        openModal(memoryModal);
    };
    modals.forEach(modal => modal.querySelector('.close-btn').addEventListener('click', () => closeModal(modal)));

    // --- 写真プレビューとリサイズ処理 ---
    memoryPhotoInput.addEventListener('change', () => {
        const file = memoryPhotoInput.files[0];
        if (!file) {
            photoPreview.src = '';
            resizedPhotoDataUrl = null;
            return;
        }
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
                resizedPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                photoPreview.src = resizedPhotoDataUrl;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
            events.push({ id: Date.now(), ...eventData, memory: null, isScrapbooked: false, photoDataUrl: null });
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
        const memoryText = document.getElementById('memory-text').value;
        const photoDataUrlToSave = resizedPhotoDataUrl;
        const eventIndex = events.findIndex(event => event.id === eventId);
        if (eventIndex > -1 && memoryText) {
            events[eventIndex].memory = memoryText;
            events[eventIndex].isScrapbooked = true;
            events[eventIndex].photoDataUrl = photoDataUrlToSave;
            saveEvents();
            renderAll();
        }
        closeModal(memoryModal);
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