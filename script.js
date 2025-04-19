const weekRows = document.getElementById('week-rows');
const totalHours = document.getElementById('total-hours');
const weekRange = document.getElementById('week-range');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');const dropdown = document.createElement('select');

let currentWeekOffset = 0;

function getWeekKey(offset) {
    const weekDates = getWeekDates(offset);
    return weekDates[0].toISOString().split('T')[0]; // Use Monday's date as key
}

function getWeekDates(offset = 0) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1 + offset * 7);

    const week = [];
    for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
    }
    return week;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateHours(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 0;
}

function renderWeek(offset = 0) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDates = getWeekDates(offset);
    weekRows.innerHTML = '';
    weekRange.textContent = `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`;

    weekDates.forEach((date, i) => {
        const row = document.createElement('tr');
        const dayId = `day-${i}`;

        row.innerHTML = `
            <td>${days[i]}</td>
            <td>${formatDate(date)}</td>
            <td>
                <div class="type-entry-container" id="${dayId}Type" data-day="${dayId}">
                </div>
            </td>
            <td>
                <div class="time-entry-container" id="${dayId}Time">
                </div>
            </td>
            <td class="daily-total" data-day="${dayId}">0.00</td>
            <td>
                <button type="button" class="add-slot-btn" data-day="${dayId}">+ Add Time</button>
            </td>
            `;
        weekRows.appendChild(row);

        const dayIdType = document.getElementById(`${dayId}Type`);
        const dayIdTime = document.getElementById(`${dayId}Time`);
        addTimeSlot(dayIdType, dayIdTime);
    
    });

    document.querySelectorAll('.add-slot-btn').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const dayIdType = e.target.getAttribute('data-day') + "Type";
            const dayIdTime = e.target.getAttribute('data-day') + "Time";
            const typeCont = document.getElementById(dayIdType)
            const timeCont = document.getElementById(dayIdTime)
            addTimeSlot(typeCont, timeCont);
        })
    );

    loadWeekData(offset);

}

function addTimeSlot(typeContainer, timeContainer) {
    const dropdown = document.createElement('select');

    const divType = document.createElement('div');
    divType.className = 'col'
    dropdown.className = 'slot-type';
    ['Work', 'Lunch', 'Break'].forEach(label => {
        const option = document.createElement('option');
        option.value = label.toLowerCase();
        option.textContent = label;
        dropdown.appendChild(option);
    });

    divType.appendChild(dropdown)
    typeContainer.appendChild(divType);
    dropdown.addEventListener('change', () => { updateHours(); saveWeekData(currentWeekOffset); });

    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';

    const clockIn = document.createElement('input');
    clockIn.type = 'time';
    clockIn.className = 'clock-in';

    const clockOut = document.createElement('input');
    clockOut.type = 'time';
    clockOut.className = 'clock-out';

    timeSlot.appendChild(clockIn);
    timeSlot.appendChild(clockOut);
    timeContainer.appendChild(timeSlot);

    clockIn.addEventListener('input', () => { updateHours(); saveWeekData(currentWeekOffset); });
    clockOut.addEventListener('input', () => { updateHours(); saveWeekData(currentWeekOffset); });
}

function updateHours() {
    let weeklyTotal = 0;

    document.querySelectorAll('.time-entry-container').forEach((timeContainer) => {
        const timeSlots = timeContainer.querySelectorAll('.time-slot');
        const dayId = timeContainer.id.replace('Time', '');
        const typeContainer = document.getElementById(`${dayId}Type`);
        const typeSlots = typeContainer.querySelectorAll('.slot-type');

        let dailyTotal = 0;

        timeSlots.forEach((slot, index) => {
            const start = slot.querySelector('.clock-in')?.value;
            const end = slot.querySelector('.clock-out')?.value;
            const type = typeSlots[index]?.value;

            if (type === 'work') {
                dailyTotal += calculateHours(start, end);
            }
        });

        const display = document.querySelector(`.daily-total[data-day="${dayId}"]`);
        if (display) {
            display.textContent = dailyTotal.toFixed(2);
        }

        weeklyTotal += dailyTotal;
    });

    totalHours.textContent = weeklyTotal.toFixed(2);
}

function saveWeekData(offset) {
    const weekKey = getWeekKey(offset);
    const data = {};

    document.querySelectorAll('.time-entry-container').forEach(container => {
        const dayId = container.id.replace('Time', '');
        const slots = container.querySelectorAll('.time-slot');
        const slotData = [];

        slots.forEach(slot => {
            const start = slot.querySelector('.clock-in')?.value || '';
            const end = slot.querySelector('.clock-out')?.value || '';
            const type = slot.querySelector('.slot-type')?.value || 'work';

            slotData.push({ start, end, type });
        });

        data[dayId] = slotData;
    });

    let storage = JSON.parse(localStorage.getItem('weeklyTimeData')) || {};
    storage[weekKey] = data;
    localStorage.setItem('weeklyTimeData', JSON.stringify(storage));
}

function loadWeekData(offset) {
    const weekKey = getWeekKey(offset);
    const storage = JSON.parse(localStorage.getItem('weeklyTimeData')) || {};
    const weekData = storage[weekKey] || {};

    Object.entries(weekData).forEach(([dayId, slots]) => {
        const typeContainer = document.getElementById(`${dayId}Type`)
        const timeContainer = document.getElementById(`${dayId}Time`);
        typeContainer.innerHTML = '';
        timeContainer.innerHTML = ''; // Clear first

        slots.forEach(slot => {
            const divType = document.createElement('div');
            divType.className = 'col'

            const dropdown = document.createElement('select');
            dropdown.className = 'slot-type';
            ['Work', 'Lunch', 'Break'].forEach(label => {
            const option = document.createElement('option');
            option.value = label.toLowerCase();
            option.textContent = label;
            if (slot.type === label.toLowerCase()) {
                option.selected = true;
            }
            dropdown.appendChild(option);
            });

            divType.appendChild(dropdown);

            const div = document.createElement('div');
            div.className = 'time-slot';

            const clockIn = document.createElement('input');
            clockIn.type = 'time';
            clockIn.className = 'clock-in';
            clockIn.value = slot.start;

            const clockOut = document.createElement('input');
            clockOut.type = 'time';
            clockOut.className = 'clock-out';
            clockOut.value = slot.end;

            div.appendChild(clockIn);
            div.appendChild(clockOut);
            timeContainer.appendChild(div);
            typeContainer.appendChild(divType)

            clockIn.addEventListener('input', () => { updateHours(); saveWeekData(currentWeekOffset); });
            clockOut.addEventListener('input', () => { updateHours(); saveWeekData(currentWeekOffset); });
            dropdown.addEventListener('change', () => { updateHours(); saveWeekData(currentWeekOffset); });
        });
    });

    updateHours();
}


prevWeekBtn.addEventListener('click', () => {
  currentWeekOffset--;
  renderWeek(currentWeekOffset);
});

nextWeekBtn.addEventListener('click', () => {
  currentWeekOffset++;
  renderWeek(currentWeekOffset);
});

renderWeek();
