class PomodoroTimer {
    constructor() {
        this.workTime = 25 * 60; // 25分
        this.breakTime = 5 * 60; // 5分
        this.longBreakTime = 15 * 60; // 15分
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.timer = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('time-display');
        this.sessionType = document.getElementById('session-type');
        this.sessionCountDisplay = document.getElementById('session-count');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.progressRing = document.querySelector('.progress-ring-circle');
        
        // プログレスリングの設定
        this.radius = this.progressRing.r.baseVal.value;
        this.circumference = 2 * Math.PI * this.radius;
        this.progressRing.style.strokeDasharray = this.circumference;
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
    }
    
    start() {
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.startBtn.textContent = '実行中...';
        
        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pause() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.textContent = '再開';
        
        clearInterval(this.timer);
    }
    
    reset() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.textContent = '開始';
        
        clearInterval(this.timer);
        
        this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    completeSession() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // 通知音を再生
        this.playNotificationSound();
        
        if (this.isWorkSession) {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
            
            // 4セッション後は長い休憩
            if (this.sessionCount % 4 === 0) {
                this.currentTime = this.longBreakTime;
                this.sessionType.textContent = '長い休憩';
            } else {
                this.currentTime = this.breakTime;
                this.sessionType.textContent = '休憩時間';
            }
            this.isWorkSession = false;
        } else {
            this.currentTime = this.workTime;
            this.sessionType.textContent = '作業時間';
            this.isWorkSession = true;
        }
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.textContent = '開始';
        
        this.updateDisplay();
        this.updateProgressRing();
        
        // ブラウザ通知
        this.showNotification();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateProgressRing() {
        const totalTime = this.isWorkSession ? this.workTime : 
                         (this.sessionType.textContent === '長い休憩' ? this.longBreakTime : this.breakTime);
        const progress = (totalTime - this.currentTime) / totalTime;
        const offset = this.circumference - (progress * this.circumference);
        
        this.progressRing.style.strokeDashoffset = offset;
        
        // 色を変更
        if (this.isWorkSession) {
            this.progressRing.style.stroke = '#ff6b6b';
        } else {
            this.progressRing.style.stroke = '#4ecdc4';
        }
    }
    
    playNotificationSound() {
        // Web Audio APIを使用して通知音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    showNotification() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                const message = this.isWorkSession ? 
                    '休憩時間が終了しました！作業を開始しましょう。' : 
                    '作業時間が終了しました！休憩を取りましょう。';
                
                new Notification('ポモドーロタイマー', {
                    body: message,
                    icon: '🍅'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.showNotification();
                    }
                });
            }
        }
    }
}

// ページ読み込み時にタイマーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    
    // 通知許可をリクエスト
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
