class Game {
    constructor() {
        this.entities = [];
        this.lastRenderTime = Date.now();
        this.timeDelta = null;
        this.spawnId = 0;
        this.mouseX = null;
        this.mouseY = null;
    }

    spawn(T, ...args) {
        let newEnt = new T(...args);
        this.entities.push(newEnt);
        return newEnt;
    }

    render(context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        this.entities.sort((a, b) => a.z - b.z).forEach(e => e.render(context));
        let currentTime = Date.now();
        this.timeDelta = currentTime - this.lastRenderTime;
        this.lastRenderTime = currentTime;
    }

    update() {
        this.entities.forEach(e => e.update && e.update(this));
    }

    receiveMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
}

class Entity {
    constructor(x, y, z, w, h) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.r = 0;
        this.active = true;
    }

    static async cacheSprite() {
        if (!(this.spritePath)) {
            throw new Error(`Entity ${this.name} does not have a static spritePath`);
        } else {
            console.log(`Caching sprite for ${this.name}`);
        }
        this.prototype.sprite = await fetch(this.spritePath)
            .then(data => data.blob())
            .then(blob => createImageBitmap(blob));
        console.log(`Sprite for ${this.name} loaded`);
    }

    render(context) {
        if (this.active) {
            let tw = this.w * context.canvas.width;
            let th;
            if (this.h) th = this.h * context.canvas.height;
            else th = tw / (this.sprite.width / this.sprite.height);
            
            let cx = this.x * context.canvas.width;
            let cy = this.y * context.canvas.height;
            context.save();
            context.translate(cx, cy);
            context.rotate(this.r);
            context.drawImage(this.sprite, -tw/2, -th/2, tw, th);
            context.restore();
        }
    }
}

class Hand extends Entity {
    static spritePath = 'https://i.imgur.com/AjSkaoH.png';
    constructor(x, y, onCollideHandler) {
        super(x, y, 0, .3);
        this.onCollideHandler = onCollideHandler;
        this.canCollide = true;
    }

    update(game) {
        this.x += this.vx * (game.timeDelta / 1000);
        this.y += this.vy * (game.timeDelta / 1000);
        this.vx += (game.mouseX - this.x)/1.5;
        this.vy += (game.mouseY - this.y)/1.5;
        this.vx *= 92 / 100;
        this.vy *= 92 / 100;
        this.r = (-2 * (1-this.x)) + (this.vx / 5) + (Math.PI / 3);
        if (this.r > Math.PI / 2) this.r = Math.PI / 2;
        if (this.checkCollision()) {
            this.onCollideHandler();
            this.canCollide = false;
        }
        if (this.checkReset()) this.canCollide = true;
    }

    checkCollision() {
        return this.canCollide && this.x > .5 && this.x < .6 && this.y > .4 && this.y < .6 && this.vx < -2;
    }

    checkReset() {
        return this.x > .9;
    }
    
}

class Jeff extends Entity {
    static spritePath = 'https://i.imgur.com/vuoQplk.png';
    constructor(x, y) {
        super(x, y, -1, .6);
    }

}

async function main(container) {
    const game = new Game();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    
    const jeff = game.spawn(Jeff, .5, .5);

    container.innerHTML = '';
    let onResizeHandler = () => {
        canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    }
    
    onResizeHandler();
    container.onresize = onResizeHandler;

    container.onmousemove = e => game.receiveMousePosition(e.clientX / canvas.width, e.clientY / canvas.height);

    let onCollideHandler = () => {
        var audio = new Audio('https://cdn.pixabay.com/download/audio/2022/10/23/audio_3a2110a5e3.mp3?filename=whip-123738.mp3');
        audio.play();
    }

    const hand = game.spawn(Hand, .5, .5, onCollideHandler);

    let clickToStart = () => {
        let button = document.createElement('button');
        button.onclick = () => {
            container.removeChild(button);
            mainLoop();
        }
        button.style.width = canvas.width + 'px';
        button.style.height = canvas.height + 'px';
        button.style.position = 'absolute';
        button.style.left = '0px';
        button.style.top = '0px';
        button.textContent = 'Click to slap Jeff Bezos';
        container.appendChild(button);
    }

    function mainLoop() {
        game.render(context);
        game.update();
        setTimeout(mainLoop, 0);
    }

    container.appendChild(canvas);
    const allTypes = [Hand, Jeff];
    Promise.all(allTypes.map(T => T.cacheSprite())).then(clickToStart);
}

main(document.body);