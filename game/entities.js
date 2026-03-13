/**
 * 💍 Wedding Journey Entities Module
 */
import { CONFIG } from './config.js';

export class BuildingEntity {
    constructor(x, z, config = {}) {
        const { w = 6 + Math.random() * 6, h = 20 + Math.random() * 40, d = 6 + Math.random() * 6 } = config;
        this.group = new THREE.Group();
        
        const colors = CONFIG.COLORS.BUILDING;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d), 
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 })
        );
        building.position.y = h / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        this.group.add(building);

        this.addSign(w, h, d);
        this.addWindows(w, h, d);
        this.group.position.set(x, 0, z);
    }

    addSign(w, h, d) {
        const isActimedi = Math.random() > 0.5;
        const signTex = isActimedi ? BuildingEntity.actimediTex : BuildingEntity.fitpetTex;
        const signGeo = new THREE.BoxGeometry(w * 0.9, 2.8, 0.6);
        const signMat = new THREE.MeshStandardMaterial({ 
            map: signTex, 
            emissive: isActimedi ? 0x00ffaa : 0x00aaff, 
            emissiveIntensity: 0.8 
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, h - 4, d / 2 + 0.35);
        this.group.add(sign);
    }

    addWindows(w, h, d) {
        const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
        const winMat = new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffaa00, emissiveIntensity: 1.2 });
        const rows = Math.floor(h / 3);
        const cols = Math.floor(w / 2);
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.4) {
                    const win = new THREE.Mesh(winGeo, winMat);
                    win.position.set(-w/2 + (c+1)*1.5, r*2.5, d/2 + 0.1);
                    this.group.add(win);
                }
            }
        }
    }

    addTo(scene) { scene.add(this.group); }
}

BuildingEntity.createLogoTexture = function(text, bgColor, textColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = textColor; ctx.font = '900 90px sans-serif'; 
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
    ctx.fillText(text, 256, 70);
    return new THREE.CanvasTexture(canvas);
};

BuildingEntity.actimediTex = BuildingEntity.createLogoTexture('액티메디', '#00ffaa', '#000000');
BuildingEntity.fitpetTex = BuildingEntity.createLogoTexture('핏펫', '#00aaff', '#000000');

export class StationEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        const platform = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 12), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.STATION_PLATFORM }));
        platform.position.y = 0.2; platform.receiveShadow = true; this.group.add(platform);

        for (let i = -1; i <= 1; i++) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
            pillar.position.set(i * 8, 2.5, -4.5); pillar.castShadow = true; this.group.add(pillar);
        }

        const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.8 }));
        roof.position.set(0, 5, -2.5); roof.rotation.x = Math.PI / 15; this.group.add(roof);

        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d'); 
        ctx.fillStyle = CONFIG.COLORS.STATION; ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = 'white'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('독산 DOKSAN', 256, 90);
        
        const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.3), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sign.position.set(0, 6.2, -2.5); this.group.add(sign);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}

export class TreeEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK }));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 8), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_LEAVES }));
        trunk.position.y = 0.75; leaves.position.y = 2.5;
        trunk.castShadow = true; leaves.castShadow = true;
        this.group.add(trunk); this.group.add(leaves);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}

export class StreetLightEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        post.position.y = 4; this.group.add(post);
        const head = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        head.position.set(0.8, 8, 0); this.group.add(head);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 }));
        bulb.position.set(1.5, 7.7, 0); this.group.add(bulb);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}

export class CloudEntity {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        for (let i = 0; i < 4; i++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 4, 16, 16), mat);
            sphere.position.set(i * 3, Math.random() * 2, Math.random() * 2);
            this.group.add(sphere);
        }
        this.group.position.set(x, y, z);
    }
    addTo(scene) { scene.add(this.group); }
}
