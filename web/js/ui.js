/**
 * 📱 UI.js (Stable Game Version)
 */
import { CONFIG } from './config.js';

export class UI {
    constructor() {
        this.dateEl = document.getElementById('current-date');
        this.overlayEl = document.getElementById('ui-overlay');
        this.hintEl = document.getElementById('scroll-hint');
        this.loaderEl = document.getElementById('loader');
        this.locationHintEl = document.getElementById('location-hint');
    }

    showUI() {
        this.overlayEl.style.opacity = '1';
        this.hintEl.style.opacity = '1';
        this.loaderEl.style.opacity = '0';
        setTimeout(() => this.loaderEl.remove(), 1000);
    }

    updateDate(distance) {
        if (!this.dateEl) return;

        const daysToAdd = Math.floor(distance / CONFIG.PIXELS_PER_DAY);
        const startDate = new Date(CONFIG.START_DATE);
        startDate.setDate(startDate.getDate() + daysToAdd);
        
        const y = startDate.getFullYear();
        const m = String(startDate.getMonth() + 1).padStart(2, '0');
        const d = String(startDate.getDate()).padStart(2, '0');
        
        this.dateEl.innerText = `${y}. ${m}. ${d}`;
        this.updateLocationHint(distance);
    }

    updateLocationHint(distance) {
        if (!this.locationHintEl || !CONFIG.STORY) return;

        // 가장 가까운 스토리 찾기
        const currentStory = [...CONFIG.STORY].reverse().find(s => distance >= s.x);
        if (currentStory) {
            this.locationHintEl.innerText = `${currentStory.title}: ${currentStory.desc}`;
        }
    }
}
